"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";

interface SimpleAlertProps {
  variant: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const SimpleAlert: React.FC<SimpleAlertProps> = (props) => {
  const { variant, children } = props;
  const toast = useToast();

  const message = useMemo(() => {
    const toText = (node: React.ReactNode): string => {
      if (node == null || typeof node === "boolean") return "";
      if (typeof node === "string" || typeof node === "number") return String(node);
      if (Array.isArray(node)) return node.map(toText).filter(Boolean).join(" ");
      if (React.isValidElement(node)) return toText((node.props as any)?.children);
      return "";
    };

    return toText(children).trim();
  }, [children]);

  const lastToastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!message) return;
    const toastKey = `${variant}:${message}`;
    if (lastToastKeyRef.current === toastKey) return;
    lastToastKeyRef.current = toastKey;

    if (variant === "success") toast.success(message);
    else if (variant === "error") toast.error(message);
    else toast.info(message); // Treat warning/info as info toasts
  }, [message, toast, variant]);

  return null;
};

export default SimpleAlert;
