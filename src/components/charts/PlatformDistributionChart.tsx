"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useUsers } from "@/hooks/useApi";
import { useState } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function PlatformDistributionChart() {
  const { users, isLoading, isError } = useUsers({ limit: 1000 });
  const [isOpen, setIsOpen] = useState(false);

  // Count users by platform (assuming users have a device_platform or device_type field)
  const platformCounts = users?.users?.reduce((acc: any, user: any) => {
    const platform = user.device_platform || user.device_type || 'unknown';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {}) || {};

  const androidCount = (platformCounts.android || 0) + (platformCounts.Android || 0);
  const iosCount = (platformCounts.ios || 0) + (platformCounts.iOS || 0) + (platformCounts.iPhone || 0);
  const webCount = platformCounts.web || platformCounts.Web || 0;
  const otherCount = Object.entries(platformCounts)
    .filter(([key]) => !['android', 'Android', 'ios', 'iOS', 'iPhone', 'web', 'Web'].includes(key))
    .reduce((sum, [, val]) => sum + (val as number), 0);

  const options: ApexOptions = {
    colors: ["#3ddc84", "#007aff", "#465fff", "#94a3b8"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 300,
    },
    labels: ["Android", "iOS", "Web", "Other"],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: {
        colors: "#64748b",
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Users",
              fontSize: "14px",
              color: "#64748b",
              formatter: () => {
                const total = androidCount + iosCount + webCount + otherCount;
                return total.toString();
              },
            },
            value: {
              fontSize: "22px",
              fontWeight: 600,
              color: "#1e293b",
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: (val: number) => {
          const total = androidCount + iosCount + webCount + otherCount;
          const percentage = ((val / total) * 100).toFixed(1);
          return `${val} users (${percentage}%)`;
        },
      },
    },
  };

  const series = [androidCount, iosCount, webCount, otherCount];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Platform Distribution
        </h3>
        <p className="mt-4 text-sm text-red-500">Failed to load user data</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Platform Distribution
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Users by device platform
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Export Data
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View Details
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={300}
          />
          
          <div className="grid grid-cols-2 gap-4 mt-6 w-full">
            <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3ddc84]"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Android</span>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {androidCount}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#007aff]"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">iOS</span>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {iosCount}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
