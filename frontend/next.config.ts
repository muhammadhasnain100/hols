import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/affiliate/referrals", destination: "/affiliate/customers", permanent: false },
      { source: "/affiliate/earnings", destination: "/affiliate/payout", permanent: false },
      { source: "/admin/profile/plans", destination: "/admin/plans", permanent: false },
      { source: "/admin/sales", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
