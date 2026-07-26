import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Zap, RefreshCw, Play, Square, Clock, Pause, RotateCcw, Database, Check, AlertCircle, SkipForward, FileSearch, ImageIcon, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { STATIC_IMAGES } from "@/admin/staticImages";

interface SlideshowSlide {
  imageUrl?: string;
  mobileImageUrl?: string;
  [key: string]: unknown;
}

interface OptimizerRun {
  id: string;
  status: string;
  mode: string;
  scope: string;
  run_type: string;
  threshold_bytes: number;
  batch_size: number;
  processed_count: number;
  done_count: number;
  error_count: number;
  skipped_count: number;
  current_original_url: string | null;
  last_message: string | null;
  stop_requested: boolean;
  started_at: string | null;
  finished_at: string | null;
  heartbeat_at: string | null;
  created_at: string;
}

interface Stats {
  pending: number;
  done: number;
  error: number;
  skipped: number;
  largePending: number;
  pendingNoSize: number;
}

interface LogEntry {
  timestamp: Date;
  action: string;
  url?: string;
  result?: string;
  details?: string;
}

const HEARTBEAT_STALE_SECONDS = 60;
const RUN_ID_KEY = "image_optimizer_run_id";
const DEFAULT_THRESHOLD_KB = 900;
const DEFAULT_BATCH_SIZE = 10;

// ===================== UTILITY FUNCTIONS =====================

function extractImageUrlsFromContent(content: unknown): string[] {
  const urls: string[] = [];
  
  const extractFromObject = (obj: unknown): void => {
    if (!obj || typeof obj !== "object") return;
    
    if (Array.isArray(obj)) {
      for (const item of obj) extractFromObject(item);
      return;
    }
    
    const record = obj as Record<string, unknown>;
    
    if (typeof record.imageUrl === "string" && record.imageUrl.trim()) urls.push(record.imageUrl.trim());
    if (typeof record.mobileImageUrl === "string" && record.mobileImageUrl.trim()) urls.push(record.mobileImageUrl.trim());
    if (typeof record.image === "string" && record.image.trim()) urls.push(record.image.trim());
    
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (typeof value === "object" && value !== null) extractFromObject(value);
    }
  };
  
  extractFromObject(content);
  return urls;
}

function shouldSkipUrl(url: string): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim().toLowerCase();
  
  if (trimmed.startsWith("/") || trimmed.startsWith("./")) return true;
  if (trimmed.startsWith("data:")) return true;
  if (trimmed.includes("compressed-images")) return true;
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return true;
  
  return false;
}

async function queueUrl(
  url: string,
  sourceTable: string,
  sourceRecordId: string
): Promise<"inserted" | "duplicate" | "error" | "skipped"> {
  if (shouldSkipUrl(url)) return "skipped";
  
  try {
    const { error } = await supabase
      .from("image_optimizations")
      .insert({
        original_url: url.trim(),
        status: "pending",
        source_type: sourceTable === "staticImages" ? "static" : "database",
        source_table: sourceTable,
        source_record_id: sourceRecordId,
      });
    
    if (error) {
      if (error.code === "23505") return "duplicate";
      return "error";
    }
    return "inserted";
  } catch {
    return "error";
  }
}

export default function ImageOptimizerAdmin() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<Stats>({ pending: 0, done: 0, error: 0, skipped: 0, largePending: 0, pendingNoSize: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  const [currentRun, setCurrentRun] = useState<OptimizerRun | null>(null);
  const [isLoadingRun, setIsLoadingRun] = useState(true);
  const runLoopRef = useRef(false);
  
  const [thresholdKB, setThresholdKB] = useState(DEFAULT_THRESHOLD_KB);
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);
  const [autoResume, setAutoResume] = useState(false);
  const thresholdBytes = thresholdKB * 1024;
  
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  
  // ===================== HELPERS =====================
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const addLog = (action: string, url?: string, result?: string, details?: string) => {
    setActivityLog(prev => [{
      timestamp: new Date(),
      action,
      url: url ? url.slice(0, 80) : undefined,
      result,
      details,
    }, ...prev.slice(0, 19)]);
  };
  
  const formatBytes = (bytes: number | null): string => {
    if (bytes === null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };
  
  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return "-";
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };
  
  // ===================== LOAD STATS =====================
  
  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [pending, done, error, skipped, largePending, pendingNoSize] = await Promise.all([
        supabase.from("image_optimizations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("image_optimizations").select("id", { count: "exact", head: true }).eq("status", "done"),
        supabase.from("image_optimizations").select("id", { count: "exact", head: true }).eq("status", "error"),
        supabase.from("image_optimizations").select("id", { count: "exact", head: true }).eq("status", "skipped"),
        supabase.from("image_optimizations").select("id", { count: "exact", head: true }).eq("status", "pending").gte("file_size_before", thresholdBytes),
        supabase.from("image_optimizations").select("id", { count: "exact", head: true }).eq("status", "pending").is("file_size_before", null),
      ]);
      
      setStats({
        pending: pending.count || 0,
        done: done.count || 0,
        error: error.count || 0,
        skipped: skipped.count || 0,
        largePending: largePending.count || 0,
        pendingNoSize: pendingNoSize.count || 0,
      });
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setIsLoadingStats(false);
    }
  }, [thresholdBytes]);
  
  // ===================== LOAD RUN =====================
  
  const loadLatestRun = useCallback(async () => {
    setIsLoadingRun(true);
    try {
      const { data, error } = await supabase
        .from("image_optimizer_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Failed to load run:", error);
        return null;
      }
      
      if (data) {
        if (data.status === "running" && data.heartbeat_at) {
          const heartbeatAge = (Date.now() - new Date(data.heartbeat_at).getTime()) / 1000;
          if (heartbeatAge > HEARTBEAT_STALE_SECONDS) {
            await supabase
              .from("image_optimizer_runs")
              .update({
                status: "paused",
                last_message: `Auto-paused after ${Math.round(heartbeatAge)}s inactivity`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.id);
            data.status = "paused";
            data.last_message = `Auto-paused after ${Math.round(heartbeatAge)}s inactivity`;
            toast.info("Found stale run - auto-paused");
          }
        }
        setCurrentRun(data as OptimizerRun);
        if (data.threshold_bytes) setThresholdKB(Math.round(data.threshold_bytes / 1024));
        if (data.batch_size) setBatchSize(data.batch_size);
        return data as OptimizerRun;
      }
      return null;
    } finally {
      setIsLoadingRun(false);
    }
  }, []);
  
  useEffect(() => {
    loadStats();
    loadLatestRun().then((run) => {
      if (run && autoResume && (run.status === "paused" || run.status === "running")) {
        const runType = run.run_type || "everything";
        if (runType === "slideshows_only") {
          runSlideshowsOnlyPipeline(run.id);
        } else {
          runEverythingPipeline(run.id);
        }
      }
    });
  }, []);
  
  // ===================== SCANNING FUNCTIONS =====================
  
  const scanSlideshows = async (): Promise<{ found: number; inserted: number }> => {
    let found = 0, inserted = 0;
    const { data: slideshows } = await supabase.from("slideshows").select("id, slides");
    
    for (const slideshow of slideshows || []) {
      const slides = slideshow.slides as SlideshowSlide[] | null;
      if (!slides || !Array.isArray(slides)) continue;
      
      for (const slide of slides) {
        for (const key of ["imageUrl", "mobileImageUrl"]) {
          const url = slide[key];
          if (typeof url === "string" && url.trim()) {
            found++;
            const result = await queueUrl(url, "slideshows", slideshow.id);
            if (result === "inserted") inserted++;
          }
        }
      }
    }
    return { found, inserted };
  };
  
  const scanContentTable = async (tableName: string): Promise<{ found: number; inserted: number }> => {
    let found = 0, inserted = 0;
    const { data } = await supabase.from(tableName as "lessons").select("id, content");
    
    for (const row of data || []) {
      const urls = extractImageUrlsFromContent(row.content);
      for (const url of urls) {
        found++;
        const result = await queueUrl(url, tableName, row.id);
        if (result === "inserted") inserted++;
      }
    }
    return { found, inserted };
  };
  
  const scanVisitors = async (): Promise<{ found: number; inserted: number }> => {
    let found = 0, inserted = 0;
    const { data } = await supabase.from("visitors").select("id, face_image_url, id_image_url");
    
    for (const row of data || []) {
      for (const url of [row.face_image_url, row.id_image_url]) {
        if (url && typeof url === "string" && url.trim()) {
          found++;
          const result = await queueUrl(url, "visitors", row.id);
          if (result === "inserted") inserted++;
        }
      }
    }
    return { found, inserted };
  };
  
  const scanStaticImages = async (): Promise<{ found: number; inserted: number }> => {
    let found = 0, inserted = 0;
    for (const img of STATIC_IMAGES) {
      if (img.url && img.url.trim()) {
        found++;
        const result = await queueUrl(img.url, "staticImages", img.id);
        if (result === "inserted") inserted++;
      }
    }
    return { found, inserted };
  };
  
  const scanSlideshowsOnly = async (): Promise<number> => {
    addLog("SCAN", undefined, "Slideshows", "Starting...");
    const result = await scanSlideshows();
    addLog("SCAN", undefined, "Complete", `Found ${result.found}, inserted ${result.inserted}`);
    return result.inserted;
  };
  
  const scanEverything = async (): Promise<number> => {
    let totalInserted = 0;
    addLog("SCAN", undefined, "Starting", "Scanning all sources...");
    
    const sources = [
      { name: "slideshows", fn: scanSlideshows },
      { name: "lessons", fn: () => scanContentTable("lessons") },
      { name: "book_lessons", fn: () => scanContentTable("book_lessons") },
      { name: "content_items", fn: () => scanContentTable("content_items") },
      { name: "toefl_items", fn: () => scanContentTable("toefl_items") },
      { name: "lessons_spanish", fn: () => scanContentTable("lessons_spanish") },
      { name: "visitors", fn: scanVisitors },
      { name: "staticImages", fn: scanStaticImages },
    ];
    
    for (const source of sources) {
      try {
        const result = await source.fn();
        totalInserted += result.inserted;
        addLog("SCAN", undefined, source.name, `Found ${result.found}, new ${result.inserted}`);
      } catch (e) {
        addLog("SCAN", undefined, source.name, `Error: ${e}`);
      }
    }
    
    addLog("SCAN", undefined, "Complete", `Total new: ${totalInserted}`);
    return totalInserted;
  };
  
  // ===================== FAST COMPRESSION (NO PROBING) =====================
  
  // Process multiple images in parallel for much faster compression
  const compressImagesBatch = async (
    runId: string, 
    slideshowsOnly: boolean, 
    batchLimit = 10,
    parallelCount = 5
  ): Promise<{ compressed: number; skipped: number; errors: number }> => {
    let compressed = 0, skipped = 0, errors = 0;
    
    // Fetch pending images (prioritize slideshows, no need for file_size_before since we skip probing)
    let query = supabase
      .from("image_optimizations")
      .select("*")
      .eq("source_table", "slideshows")
      .eq("status", "pending")
      .is("optimized_url", null)
      .order("created_at", { ascending: true })
      .limit(batchLimit);
    
    const { data: slideshowPending } = await query;
    let toCompress = slideshowPending || [];
    
    // For everything mode, add other sources if we have room
    if (!slideshowsOnly && toCompress.length < batchLimit) {
      const remaining = batchLimit - toCompress.length;
      const { data: otherPending } = await supabase
        .from("image_optimizations")
        .select("*")
        .neq("source_table", "slideshows")
        .eq("status", "pending")
        .is("optimized_url", null)
        .order("created_at", { ascending: true })
        .limit(remaining);
      
      if (otherPending) toCompress = [...toCompress, ...otherPending];
    }
    
    if (toCompress.length === 0) {
      return { compressed, skipped, errors };
    }
    
    // Process images in parallel chunks
    for (let i = 0; i < toCompress.length; i += parallelCount) {
      // Check for stop request
      const { data: checkRun } = await supabase
        .from("image_optimizer_runs")
        .select("stop_requested")
        .eq("id", runId)
        .single();
      
      if (checkRun?.stop_requested) break;
      
      const chunk = toCompress.slice(i, i + parallelCount);
      
      // Update status with current batch
      await supabase.from("image_optimizer_runs").update({
        heartbeat_at: new Date().toISOString(),
        current_original_url: chunk[0]?.original_url,
        last_message: `Compressing ${chunk.length} images in parallel...`,
      }).eq("id", runId);
      
      // Process chunk in parallel
      const results = await Promise.allSettled(
        chunk.map(async (image) => {
          try {
            const { data, error } = await supabase.functions.invoke("compress-image-v2", {
              body: { originalUrl: image.original_url, minBytes: thresholdBytes },
            });
            
            if (error) {
              return { status: "error" as const, url: image.original_url, message: error.message };
            }
            
            const resultStatus = data?.status;
            if (resultStatus === "done" || resultStatus === "already_done") {
              return { 
                status: "done" as const, 
                url: image.original_url, 
                ratio: data.compressionRatio || 0 
              };
            } else if (resultStatus === "skipped") {
              return { 
                status: "skipped" as const, 
                url: image.original_url, 
                message: data.errorMessage || "Below threshold" 
              };
            } else {
              return { 
                status: "error" as const, 
                url: image.original_url, 
                message: data?.errorMessage || "Unknown" 
              };
            }
          } catch (e) {
            return { 
              status: "error" as const, 
              url: image.original_url, 
              message: e instanceof Error ? e.message : "Unknown" 
            };
          }
        })
      );
      
      // Process results
      for (const result of results) {
        if (result.status === "fulfilled") {
          const r = result.value;
          if (r.status === "done") {
            compressed++;
            addLog("COMPRESS", r.url, "Done", `${r.ratio}% saved`);
          } else if (r.status === "skipped") {
            skipped++;
            addLog("COMPRESS", r.url, "Skipped", r.message || "");
          } else {
            errors++;
            addLog("COMPRESS", r.url, "Error", r.message || "");
          }
        } else {
          errors++;
          addLog("COMPRESS", undefined, "Error", result.reason?.message || "Promise rejected");
        }
      }
      
      // Update run counts
      const { data: currentRunData } = await supabase
        .from("image_optimizer_runs")
        .select("processed_count, done_count, error_count, skipped_count")
        .eq("id", runId)
        .single();
      
      if (currentRunData) {
        const batchCompressed = results.filter(r => 
          r.status === "fulfilled" && (r.value.status === "done")
        ).length;
        const batchSkipped = results.filter(r => 
          r.status === "fulfilled" && r.value.status === "skipped"
        ).length;
        const batchErrors = results.filter(r => 
          r.status === "rejected" || (r.status === "fulfilled" && r.value.status === "error")
        ).length;
        
        await supabase.from("image_optimizer_runs").update({
          processed_count: currentRunData.processed_count + chunk.length,
          done_count: currentRunData.done_count + batchCompressed,
          error_count: currentRunData.error_count + batchErrors,
          skipped_count: currentRunData.skipped_count + batchSkipped,
        }).eq("id", runId);
      }
    }
    
    return { compressed, skipped, errors };
  };
  
  // ===================== PIPELINES =====================
  
  const runSlideshowsOnlyPipeline = async (existingRunId?: string) => {
    if (runLoopRef.current) {
      toast.info("Pipeline already running");
      return;
    }
    
    runLoopRef.current = true;
    let runId = existingRunId;
    
    if (!runId) {
      const { data: newRun, error } = await supabase
        .from("image_optimizer_runs")
        .insert({
          status: "running",
          mode: "full_pipeline",
          scope: "slideshows",
          run_type: "slideshows_only",
          threshold_bytes: thresholdBytes,
          batch_size: batchSize,
          started_at: new Date().toISOString(),
          heartbeat_at: new Date().toISOString(),
          last_message: "Starting slideshows-only optimization...",
        })
        .select()
        .single();
      
      if (error || !newRun) {
        toast.error("Failed to create run");
        runLoopRef.current = false;
        return;
      }
      
      runId = newRun.id;
      localStorage.setItem(RUN_ID_KEY, runId);
      setCurrentRun(newRun as OptimizerRun);
    } else {
      await supabase.from("image_optimizer_runs").update({
        status: "running",
        stop_requested: false,
        heartbeat_at: new Date().toISOString(),
        last_message: "Resuming...",
        updated_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    
    toast.info("Slideshows optimization started");
    
    try {
      while (runLoopRef.current) {
        const { data: run } = await supabase
          .from("image_optimizer_runs")
          .select("*")
          .eq("id", runId)
          .single();
        
        if (!run) break;
        setCurrentRun(run as OptimizerRun);
        
        if (run.stop_requested || run.status !== "running") {
          await supabase.from("image_optimizer_runs").update({
            status: "paused",
            last_message: run.stop_requested ? "Paused by user" : run.last_message,
            current_original_url: null,
          }).eq("id", runId);
          break;
        }
        
        // Step 1: Scan slideshows only
        await supabase.from("image_optimizer_runs").update({
          last_message: "Scanning slideshows...",
          heartbeat_at: new Date().toISOString(),
        }).eq("id", runId);
        await scanSlideshowsOnly();
        await loadStats();
        
        // Step 2: Compress pending slideshows directly (no probing - compress-image-v2 handles size check)
        const { count: pendingCount } = await supabase
          .from("image_optimizations")
          .select("id", { count: "exact", head: true })
          .eq("source_table", "slideshows")
          .eq("status", "pending")
          .is("optimized_url", null);
        
        if ((pendingCount || 0) > 0) {
          await supabase.from("image_optimizer_runs").update({
            last_message: `⚡ Fast compressing ${pendingCount} images (5 parallel)...`,
            heartbeat_at: new Date().toISOString(),
          }).eq("id", runId);
          const result = await compressImagesBatch(runId, true, batchSize, 5);
          await loadStats();
          
          // Continue if we processed any images
          if (result.compressed + result.skipped + result.errors > 0) {
            continue;
          }
        }
        
        // Complete!
        await supabase.from("image_optimizer_runs").update({
          status: "completed",
          finished_at: new Date().toISOString(),
          last_message: "✅ All slideshow images processed!",
          current_original_url: null,
        }).eq("id", runId);
        
        toast.success("All slideshow images optimized!");
        addLog("COMPLETE", undefined, "Slideshows", "All slideshow images optimized");
        break;
      }
    } catch (e) {
      console.error("Pipeline error:", e);
      await supabase.from("image_optimizer_runs").update({
        status: "error",
        last_message: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
      }).eq("id", runId);
    } finally {
      runLoopRef.current = false;
      await loadLatestRun();
      await loadStats();
    }
  };
  
  const runEverythingPipeline = async (existingRunId?: string) => {
    if (runLoopRef.current) {
      toast.info("Pipeline already running");
      return;
    }
    
    runLoopRef.current = true;
    let runId = existingRunId;
    
    if (!runId) {
      const { data: newRun, error } = await supabase
        .from("image_optimizer_runs")
        .insert({
          status: "running",
          mode: "full_pipeline",
          scope: "all",
          run_type: "everything",
          threshold_bytes: thresholdBytes,
          batch_size: batchSize,
          started_at: new Date().toISOString(),
          heartbeat_at: new Date().toISOString(),
          last_message: "Starting full optimization...",
        })
        .select()
        .single();
      
      if (error || !newRun) {
        toast.error("Failed to create run");
        runLoopRef.current = false;
        return;
      }
      
      runId = newRun.id;
      localStorage.setItem(RUN_ID_KEY, runId);
      setCurrentRun(newRun as OptimizerRun);
    } else {
      await supabase.from("image_optimizer_runs").update({
        status: "running",
        stop_requested: false,
        heartbeat_at: new Date().toISOString(),
        last_message: "Resuming...",
        updated_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    
    toast.info("Full optimization started");
    
    try {
      while (runLoopRef.current) {
        const { data: run } = await supabase
          .from("image_optimizer_runs")
          .select("*")
          .eq("id", runId)
          .single();
        
        if (!run) break;
        setCurrentRun(run as OptimizerRun);
        
        if (run.stop_requested || run.status !== "running") {
          await supabase.from("image_optimizer_runs").update({
            status: "paused",
            last_message: run.stop_requested ? "Paused by user" : run.last_message,
            current_original_url: null,
          }).eq("id", runId);
          break;
        }
        
        // Step 1: Scan everything
        await supabase.from("image_optimizer_runs").update({
          last_message: "Scanning all sources...",
          heartbeat_at: new Date().toISOString(),
        }).eq("id", runId);
        await scanEverything();
        await loadStats();
        
        // Step 2: Compress pending images directly (no probing - compress-image-v2 handles size check)
        const { count: pendingCount } = await supabase
          .from("image_optimizations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .is("optimized_url", null);
        
        if ((pendingCount || 0) > 0) {
          await supabase.from("image_optimizer_runs").update({
            last_message: `⚡ Fast compressing ${pendingCount} images (5 parallel)...`,
            heartbeat_at: new Date().toISOString(),
          }).eq("id", runId);
          const result = await compressImagesBatch(runId, false, batchSize, 5);
          await loadStats();
          
          // Continue if we processed any images
          if (result.compressed + result.skipped + result.errors > 0) {
            continue;
          }
        }
        
        // Complete!
        await supabase.from("image_optimizer_runs").update({
          status: "completed",
          finished_at: new Date().toISOString(),
          last_message: "✅ All images processed!",
          current_original_url: null,
        }).eq("id", runId);
        
        toast.success("All images optimized!");
        addLog("COMPLETE", undefined, "Everything", "All large images optimized");
        break;
      }
    } catch (e) {
      console.error("Pipeline error:", e);
      await supabase.from("image_optimizer_runs").update({
        status: "error",
        last_message: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
      }).eq("id", runId);
    } finally {
      runLoopRef.current = false;
      await loadLatestRun();
      await loadStats();
    }
  };
  
  // ===================== CONTROL FUNCTIONS =====================
  
  const stopOptimization = async () => {
    if (!currentRun) return;
    
    await supabase.from("image_optimizer_runs").update({
      stop_requested: true,
      last_message: "Stopping...",
    }).eq("id", currentRun.id);
    
    setCurrentRun({ ...currentRun, stop_requested: true, last_message: "Stopping..." });
    runLoopRef.current = false;
    toast.info("Stopping after current operation...");
  };
  
  const resumeOptimization = () => {
    if (!currentRun) return;
    const runType = currentRun.run_type || "everything";
    if (runType === "slideshows_only") {
      runSlideshowsOnlyPipeline(currentRun.id);
    } else {
      runEverythingPipeline(currentRun.id);
    }
  };
  
  const retryErrors = async () => {
    const { data: errorRows } = await supabase
      .from("image_optimizations")
      .select("id")
      .eq("status", "error")
      .limit(50);
    
    if (!errorRows || errorRows.length === 0) {
      toast.info("No error images to retry");
      return;
    }
    
    const ids = errorRows.map(r => r.id);
    await supabase.from("image_optimizations").update({
      status: "pending",
      error_message: null,
    }).in("id", ids);
    
    toast.success(`Reset ${ids.length} images to pending`);
    await loadStats();
  };
  
  const resetSkipped = async () => {
    const { error } = await supabase
      .from("image_optimizations")
      .update({ status: "pending", error_message: null, file_size_before: null })
      .eq("status", "skipped");
    
    if (error) {
      toast.error("Failed to reset");
      return;
    }
    
    toast.success("Reset skipped images back to pending");
    await loadStats();
  };
  
  // ===================== RENDER =====================
  
  const isRunning = currentRun?.status === "running" && runLoopRef.current;
  const canResume = currentRun && (currentRun.status === "paused" || (currentRun.status === "running" && !runLoopRef.current));
  const canStart = !isRunning && (!currentRun || currentRun.status === "completed" || currentRun.status === "error" || canResume === false);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getRunTypeLabel = (runType: string) => {
    return runType === "slideshows_only" ? "Slideshows Only" : "Everything";
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Image Optimizer</h1>
            <p className="text-muted-foreground text-sm">
              Compress images ≥ {thresholdKB}KB automatically
            </p>
          </div>
        </div>
        
        {/* Main Action Card */}
        <Card className="mb-6 border-2 border-primary">
          <CardContent className="pt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{stats.done}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">{stats.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">{stats.error}</div>
                <div className="text-xs text-muted-foreground">Error</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{stats.largePending}</div>
                <div className="text-xs text-muted-foreground">Large Pending</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">{stats.pendingNoSize}</div>
                <div className="text-xs text-muted-foreground">Size Unknown</div>
              </div>
            </div>
            
            {/* Main Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-4">
              {!isRunning && !canResume && (
                <>
                  <Button
                    onClick={() => runSlideshowsOnlyPipeline()}
                    disabled={isLoadingRun || isRunning}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {isLoadingRun ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Layers className="mr-2 h-5 w-5" />
                    )}
                    Optimize Slideshows only (≥ {thresholdKB}KB)
                  </Button>
                  
                  <Button
                    onClick={() => runEverythingPipeline()}
                    disabled={isLoadingRun || isRunning}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    {isLoadingRun ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-5 w-5" />
                    )}
                    Optimize EVERYTHING (≥ {thresholdKB}KB)
                  </Button>
                </>
              )}
              
              {canResume && (
                <Button
                  onClick={resumeOptimization}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Resume ({getRunTypeLabel(currentRun?.run_type || "everything")})
                </Button>
              )}
              
              {isRunning && (
                <Button
                  onClick={stopOptimization}
                  variant="destructive"
                  size="lg"
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              )}
              
              <Button
                onClick={() => { loadStats(); loadLatestRun(); }}
                variant="ghost"
                size="sm"
                disabled={isLoadingStats}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            {/* Current Run Status */}
            {currentRun && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusBadge(currentRun.status)}
                  <Badge variant="outline" className="text-xs">
                    {getRunTypeLabel(currentRun.run_type || "everything")}
                  </Badge>
                  {isRunning && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {currentRun.last_message}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                  <div>
                    <span className="text-muted-foreground">Processed:</span>
                    <span className="ml-1 font-medium">{currentRun.processed_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Done:</span>
                    <span className="ml-1 font-medium text-green-600">{currentRun.done_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>
                    <span className="ml-1 font-medium text-red-600">{currentRun.error_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skipped:</span>
                    <span className="ml-1 font-medium text-yellow-600">{currentRun.skipped_count}</span>
                  </div>
                </div>
                
                {currentRun.current_original_url && (
                  <div className="text-xs text-muted-foreground truncate mb-1">
                    Currently: {currentRun.current_original_url.slice(0, 70)}...
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Heartbeat: {formatTimeAgo(currentRun.heartbeat_at)}
                  </span>
                  <span>Threshold: {Math.round(currentRun.threshold_bytes / 1024)}KB</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Activity Log */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Recent Actions (last 20)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet. Start optimization to see logs.
              </p>
            ) : (
              <div className="max-h-[200px] overflow-y-auto border rounded text-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Time</TableHead>
                      <TableHead className="w-20">Action</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="w-20">Result</TableHead>
                      <TableHead className="w-32">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog.map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.action === "COMPRESS" ? "default" : "secondary"} className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono truncate max-w-[180px]">
                          {log.url || "-"}
                        </TableCell>
                        <TableCell>
                          {log.result === "Done" && <Check className="h-3 w-3 text-green-500 inline mr-1" />}
                          {log.result === "Skipped" && <SkipForward className="h-3 w-3 text-yellow-500 inline mr-1" />}
                          {log.result === "Error" && <AlertCircle className="h-3 w-3 text-red-500 inline mr-1" />}
                          {log.result}
                        </TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Advanced Settings (collapsed) */}
        <Accordion type="single" collapsible>
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm text-muted-foreground">
              Advanced Settings & Tools
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Threshold:</span>
                    <Input
                      type="number"
                      value={thresholdKB}
                      onChange={(e) => setThresholdKB(Math.max(1, parseInt(e.target.value) || DEFAULT_THRESHOLD_KB))}
                      className="w-20"
                      min={1}
                      disabled={isRunning}
                    />
                    <span className="text-xs text-muted-foreground">KB</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Batch:</span>
                    <Select value={String(batchSize)} onValueChange={(v) => setBatchSize(Number(v))} disabled={isRunning}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="auto-resume"
                      checked={autoResume}
                      onCheckedChange={(checked) => setAutoResume(!!checked)}
                    />
                    <label htmlFor="auto-resume" className="text-sm text-muted-foreground">
                      Auto-resume on page load
                    </label>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={retryErrors} variant="outline" size="sm" disabled={isRunning}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry Errors ({stats.error})
                  </Button>
                  
                  <Button onClick={resetSkipped} variant="outline" size="sm" disabled={isRunning}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset All Skipped to Pending
                  </Button>
                  
                  <Button
                    onClick={() => scanEverything().then(() => { loadStats(); toast.success("Scan complete"); })}
                    variant="outline"
                    size="sm"
                    disabled={isRunning}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Scan Only (no compress)
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
