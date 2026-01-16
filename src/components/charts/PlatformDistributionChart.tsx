"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { usePlatformDistribution } from "@/hooks/useApi";
import { useState } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

/**
 * Platform Distribution Chart
 * Uses users.provider field (device/google/apple) from the backend analytics API
 */
export default function PlatformDistributionChart() {
  const { distribution, total, isLoading, isError } = usePlatformDistribution();
  const [isOpen, setIsOpen] = useState(false);

  // Map provider names to display labels and colors
  const providerConfig: Record<string, { label: string; color: string }> = {
    device: { label: "Device ID", color: "#94a3b8" },
    google: { label: "Google", color: "#4285f4" },
    apple: { label: "Apple", color: "#000000" },
  };

  // Build chart data from API response
  const labels: string[] = [];
  const series: number[] = [];
  const colors: string[] = [];

  distribution.forEach((item: { provider: string; count: number }) => {
    const config = providerConfig[item.provider] || { 
      label: item.provider, 
      color: "#64748b" 
    };
    labels.push(config.label);
    series.push(item.count);
    colors.push(config.color);
  });

  const options: ApexOptions = {
    colors: colors.length > 0 ? colors : ["#94a3b8"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 300,
    },
    labels: labels.length > 0 ? labels : ["No Data"],
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
              formatter: () => total.toString(),
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
          const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
          return `${val} users (${percentage}%)`;
        },
      },
    },
  };

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
        <p className="mt-4 text-sm text-red-500">Failed to load platform data</p>
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
            Users by authentication provider
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
            series={series.length > 0 ? series : [1]}
            type="donut"
            height={300}
          />
          
          <div className="grid grid-cols-3 gap-3 mt-6 w-full">
            {distribution.map((item: { provider: string; count: number; percentage: number }) => {
              const config = providerConfig[item.provider] || {
                label: item.provider,
                color: "#64748b",
              };
              return (
                <div
                  key={item.provider}
                  className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {item.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.percentage}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
