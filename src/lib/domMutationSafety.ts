let isDomMutationSafetyInstalled = false;

export function installDomMutationSafety() {
  if (isDomMutationSafetyInstalled || typeof window === "undefined") {
    return;
  }

  isDomMutationSafetyInstalled = true;

  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }

    return originalRemoveChild.call(this, child) as T;
  };

  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }

    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}