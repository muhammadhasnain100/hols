"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  portalPageDescClass,
  portalPageTitleClass,
} from "@/components/platform/provider/portal-styles";
import { PaymentHeroVisual } from "@/components/platform/provider/student/payment/PaymentHeroVisual";
import { PaymentSubnav } from "@/components/platform/provider/student/payment/PaymentSubnav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { cn } from "@/lib/utils";

type PaymentVisualVariant = "membership" | "orders" | "card";

type PaymentPageLayoutProps = {
  title: string;
  description: string;
  visual: PaymentVisualVariant;
  children: React.ReactNode;
};

export function PaymentPageLayout({ title, description, visual, children }: PaymentPageLayoutProps) {
  return (
    <PortalShell role="student" title={title} showPageHeader={false} nav={studentNav}>
      <div className="portal-guide-card mb-2 rounded-[1.75rem]">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-9 md:py-5 lg:px-10">
          <header className="min-w-0 flex-1">
            <p className="portal-page-eyebrow">HOLS · Billing</p>
            <h1 className={cn("mt-2", portalPageTitleClass)}>{title}</h1>
            <p className={cn("mt-2 max-w-lg", portalPageDescClass)}>{description}</p>
          </header>

          <PaymentHeroVisual variant={visual} className="mx-auto sm:mx-0 sm:justify-self-end" />
        </div>

        <div className="px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
          <div className="profile-guide-body rounded-2xl px-5 pb-6 pt-5 md:px-7 md:pb-8 md:pt-6 lg:px-8 lg:pb-9">
            <PaymentSubnav />
            <div className="mt-6 grid w-full gap-5 md:gap-6">{children}</div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
