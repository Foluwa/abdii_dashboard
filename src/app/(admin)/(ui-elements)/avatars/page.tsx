import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Avatar from "@/components/ui/avatar/Avatar";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Avatars | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Avatars page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function AvatarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Avatar" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Default Avatar">
          {/* Default Avatar (No Status) */}
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo1" size="xsmall" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo1" size="small" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo1" size="medium" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo1" size="large" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo1" size="xlarge" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo1" size="xxlarge" />
          </div>
        </ComponentCard>
        <ComponentCard title="Avatar with online indicator">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo2"
              size="xsmall"
              status="online"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo2"
              size="small"
              status="online"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo2"
              size="medium"
              status="online"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo2"
              size="large"
              status="online"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo2"
              size="xlarge"
              status="online"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo2"
              size="xxlarge"
              status="online"
            />
          </div>
        </ComponentCard>
        <ComponentCard title="Avatar with Offline indicator">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo3"
              size="xsmall"
              status="offline"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo3"
              size="small"
              status="offline"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo3"
              size="medium"
              status="offline"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo3"
              size="large"
              status="offline"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo3"
              size="xlarge"
              status="offline"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo3"
              size="xxlarge"
              status="offline"
            />
          </div>
        </ComponentCard>{" "}
        <ComponentCard title="Avatar with busy indicator">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo4"
              size="xsmall"
              status="busy"
            />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo4" size="small" status="busy" />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo4"
              size="medium"
              status="busy"
            />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo4" size="large" status="busy" />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo4"
              size="xlarge"
              status="busy"
            />
            <Avatar
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo4"
              size="xxlarge"
              status="busy"
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
