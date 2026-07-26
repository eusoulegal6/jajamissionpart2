import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseImageScanner } from "@/components/admin/DatabaseImageScanner";
import { StaticImageScanner } from "@/components/admin/StaticImageScanner";

export default function ImageCompressionAdmin() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Image Compression Admin</h1>
        <p className="text-muted-foreground mb-6">
          Compress images from database lessons and static source files. Database images will be updated directly.
        </p>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="database">Database Images</TabsTrigger>
            <TabsTrigger value="static">Static Images</TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <DatabaseImageScanner />
          </TabsContent>

          <TabsContent value="static">
            <StaticImageScanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
