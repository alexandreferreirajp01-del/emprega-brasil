 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/Layout.jsx b/src/Layout.jsx
index e060851a1bd2a0fdb6c954b6dda91df1568c5980..8b0d7f1dbc6ad0c6ca54b9a420e04c34e0cc40ed 100644
--- a/src/Layout.jsx
+++ b/src/Layout.jsx
@@ -15,50 +15,51 @@ import {
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import FloatingButtons from "@/components/common/FloatingButtons";
 import AdSenseHead from "@/components/common/AdSenseHead";
 import SEOHead from "@/components/common/SEOHead";
 import FloatingChatButton from "@/components/chat/FloatingChatButton";
 import SupportButton from "@/components/support/SupportButton";
 import FloatingSupportChat from "@/components/support/FloatingSupportChat";
 import NativePermissionModal from "@/components/common/NativePermissionModal";
 import PushManager from "@/components/push/PushManager";
 import PopupManager from "@/components/common/PopupManager";
 import ServiceWorkerManager from "@/components/push/ServiceWorkerManager";
 import NotificationBell from "@/components/notifications/NotificationBell";
 import OnlineUsersTrigger from "@/components/admin/OnlineUsersTrigger";
 import AdminQuickAccessDrawer from "@/components/admin/AdminQuickAccessDrawer";
 import SessionHeartbeat from "@/components/common/SessionHeartbeat";
 import ApplyBasicPermissions from "@/components/common/ApplyBasicPermissions";
 import CookieConsent from "@/components/common/CookieConsent";
 import RouteGuard from "@/components/common/RouteGuard";
 import NavigationFallback from "@/components/common/NavigationFallback";
 import PopunderAd from "@/components/ads/PopunderAd";
 import SocialBarAd from "@/components/ads/SocialBarAd";
 import BannerAd from "@/components/ads/BannerAd";
 import WelcomePopup from "@/components/common/WelcomePopup";
+import PremiumTrialWatcher from "@/components/subscription/PremiumTrialWatcher";
 const HomeTabPage = React.lazy(() => import("@/pages/Home"));
 const JobsTabPage = React.lazy(() => import("@/pages/Jobs"));
 const NewsTabPage = React.lazy(() => import("@/pages/News"));
 const FeedTabPage = React.lazy(() => import("@/pages/Feed"));
 
 const TAB_PAGES = ['Home', 'Jobs', 'News', 'Feed'];
 const TAB_COMPONENTS = {
   Home: HomeTabPage,
   Jobs: JobsTabPage,
   News: NewsTabPage,
   Feed: FeedTabPage,
 };
 
 
 // Atalhos movidos para AdminQuickAccessDrawer component
 
 export default function Layout({ children, currentPageName }) {
   const [user, setUser] = useState(null);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [darkMode, setDarkMode] = useState(false);
   const [navItems, setNavItems] = useState([]);
   const [showVagasSubmenu, setShowVagasSubmenu] = useState(false);
   const [mountedTabs, setMountedTabs] = useState(new Set([currentPageName]));
   const navigate = useNavigate();
   const location = useLocation();
@@ -688,30 +689,31 @@ export default function Layout({ children, currentPageName }) {
             currentPageName === item.page ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
           }`}
         >
           <item.icon className="w-5 h-5 mb-0.5 flex-shrink-0" />
           <span className="text-[10px] truncate max-w-full">{item.name}</span>
         </Link>
       ))}
     </div>
   </nav>
 
   {/* AdsTerra Banner 320x50 - Mobile Footer */}
   <div className="md:hidden fixed z-[9997] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-1" style={{
     bottom: 'calc(64px + var(--sab, env(safe-area-inset-bottom, 0px)))',
     left: 0,
     right: 0,
     zIndex: 9997
   }}>
     <BannerAd size="320x50" pageName={currentPageName} location="footer" className="mx-auto" />
   </div>
 
   <FloatingButtons />
   <FloatingSupportChat />
   <CookieConsent />
   <PopupManager />
   <WelcomePopup />
+  <PremiumTrialWatcher />
 
   {/* Submenu de Gestão de Vagas removido - agora está no AdminQuickAccessDrawer */}
   </div>
   );
 }
\ No newline at end of file
 
EOF
)
