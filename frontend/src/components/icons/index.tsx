/**
 * HOLS vector icon system — Lucide SVG icons with brand-soft stroke defaults.
 * Prefer these over inline <svg> paths or unicode glyphs for UI chrome.
 */

import type { LucideIcon, LucideProps } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  BookOpen,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleHelp,
  CirclePlay,
  Clock,
  ClipboardList,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Focus,
  Globe,
  Highlighter,
  LayoutDashboard,
  Library,
  Link2,
  List,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Menu,
  MessageSquare,
  Mic,
  Minus,
  Moon,
  Newspaper,
  NotebookPen,
  PanelTop,
  PenLine,
  Plus,
  Receipt,
  Rocket,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  User,
  Users,
  Wallet,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

/** Soft stroke weight aligned with HOLS iconography guidelines. */
export const ICON_STROKE = 1.75;

export type IconProps = LucideProps & {
  icon: LucideIcon;
};

/** Thin wrapper so every UI glyph shares size + stroke defaults. */
export function Icon({
  icon: Lucide,
  size = 16,
  strokeWidth = ICON_STROKE,
  absoluteStrokeWidth = false,
  "aria-hidden": ariaHidden = true,
  ...props
}: IconProps) {
  return (
    <Lucide
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

/** Portal nav chrome — matches previous `NavIcon` footprint. */
export function NavIcon({
  icon,
  size = 16,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  return (
    <span className="portal-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-current transition-colors duration-200">
      <Icon icon={icon} size={size} className={className} />
    </span>
  );
}

export const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  bell: Bell,
  bookOpen: BookOpen,
  calculator: Calculator,
  calendar: Calendar,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  circleAlert: CircleAlert,
  circleHelp: CircleHelp,
  circlePlay: CirclePlay,
  clock: Clock,
  clipboardList: ClipboardList,
  copy: Copy,
  creditCard: CreditCard,
  dollarSign: DollarSign,
  eye: Eye,
  eyeOff: EyeOff,
  fileText: FileText,
  focus: Focus,
  globe: Globe,
  highlighter: Highlighter,
  layoutDashboard: LayoutDashboard,
  library: Library,
  link2: Link2,
  list: List,
  loader2: Loader2,
  lock: Lock,
  logOut: LogOut,
  mail: Mail,
  mapPin: MapPin,
  maximize2: Maximize2,
  menu: Menu,
  messageSquare: MessageSquare,
  mic: Mic,
  minus: Minus,
  moon: Moon,
  newspaper: Newspaper,
  notebookPen: NotebookPen,
  panelTop: PanelTop,
  penLine: PenLine,
  plus: Plus,
  receipt: Receipt,
  rocket: Rocket,
  rotateCcw: RotateCcw,
  search: Search,
  send: Send,
  settings: Settings,
  shield: Shield,
  shieldCheck: ShieldCheck,
  shoppingBag: ShoppingBag,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  thumbsDown: ThumbsDown,
  thumbsUp: ThumbsUp,
  trash2: Trash2,
  undo2: Undo2,
  user: User,
  users: Users,
  wallet: Wallet,
  x: X,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
} as const;

export type IconName = keyof typeof icons;

export {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  BookOpen,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleHelp,
  CirclePlay,
  Clock,
  ClipboardList,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Focus,
  Globe,
  Highlighter,
  LayoutDashboard,
  Library,
  Link2,
  List,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Menu,
  MessageSquare,
  Mic,
  Minus,
  Moon,
  Newspaper,
  NotebookPen,
  PanelTop,
  PenLine,
  Plus,
  Receipt,
  Rocket,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  User,
  Users,
  Wallet,
  X,
  ZoomIn,
  ZoomOut,
};
