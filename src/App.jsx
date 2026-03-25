 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/App.jsx b/src/App.jsx
index f9547baaff6172cfb06ea7cdbd6e9f3e0123eeb9..5529d60fe759fd6d864acf70c6072808a537648a 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -1,99 +1,109 @@
 import React from 'react'
 import './App.css'
 import AgenteAdSense from '@/pages/AgenteAdSense';
 import ForgotPasswordPage from '@/pages/ForgotPassword';
 import ResetPasswordPage from '@/pages/ResetPassword';
 import { Toaster } from "@/components/ui/toaster"
 import { QueryClientProvider } from '@tanstack/react-query'
 import { queryClientInstance } from '@/lib/query-client'
 import VisualEditAgent from '@/lib/VisualEditAgent'
 import NavigationTracker from '@/lib/NavigationTracker'
 import { pagesConfig } from './pages.config'
 import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
 import PageNotFound from './lib/PageNotFound';
 import { AuthProvider, useAuth } from '@/lib/AuthContext';
 import UserNotRegisteredError from '@/components/UserNotRegisteredError';
+import SpecialLinkEntry from '@/pages/SpecialLinkEntry';
 
 const { Pages, Layout, mainPage } = pagesConfig;
 const mainPageKey = mainPage ?? Object.keys(Pages)[0];
 const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
 
 const LayoutWrapper = ({ children, currentPageName }) => Layout ?
   <Layout currentPageName={currentPageName}>{children}</Layout>
   : <>{children}</>;
 
 const AuthenticatedApp = () => {
   const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
 
+  React.useEffect(() => {
+    if (!isAuthenticated) return;
+    const pendingSlug = sessionStorage.getItem('pending_special_link_slug');
+    if (!pendingSlug) return;
+    sessionStorage.removeItem('pending_special_link_slug');
+    window.location.href = `/${pendingSlug}`;
+  }, [isAuthenticated]);
+
   // Show loading spinner while checking app public settings or auth
   if (isLoadingPublicSettings || isLoadingAuth) {
     return (
       <div className="fixed inset-0 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
       </div>
     );
   }
 
   // Handle authentication errors
   if (authError) {
     if (authError.type === 'user_not_registered') {
       return <UserNotRegisteredError />;
     } else if (authError.type === 'auth_required') {
       // Redirect to login automatically
       navigateToLogin();
       return null;
     }
   }
 
   // Render the main app
   return (
     <Routes>
       <Route path="/" element={
         <LayoutWrapper currentPageName={mainPageKey}>
           <MainPage />
         </LayoutWrapper>
       } />
       {Object.entries(Pages).map(([path, Page]) => (
         <Route
           key={path}
           path={`/${path}`}
           element={
             <LayoutWrapper currentPageName={path}>
               <Page />
             </LayoutWrapper>
           }
         />
       ))}
       <Route path="/AgenteAdSense" element={<LayoutWrapper currentPageName="AgenteAdSense"><AgenteAdSense /></LayoutWrapper>} />
       <Route path="/AuditoriaLinks" element={<LayoutWrapper currentPageName="AuditoriaLinks"><React.Suspense fallback={null}>{React.createElement(React.lazy(() => import('@/pages/AuditoriaLinks')))}</React.Suspense></LayoutWrapper>} />
       <Route path="/VagasPendentesIA" element={<LayoutWrapper currentPageName="VagasPendentesIA"><React.Suspense fallback={null}>{React.createElement(React.lazy(() => import('@/pages/VagasPendentesIA')))}</React.Suspense></LayoutWrapper>} />
       <Route path="/TelegramConfig" element={<LayoutWrapper currentPageName="TelegramConfig"><React.Suspense fallback={null}>{React.createElement(React.lazy(() => import('@/pages/TelegramConfig')))}</React.Suspense></LayoutWrapper>} />
       <Route path="/SaudeDoSistema" element={<LayoutWrapper currentPageName="SaudeDoSistema"><React.Suspense fallback={null}>{React.createElement(React.lazy(() => import('@/pages/SaudeDoSistema')))}</React.Suspense></LayoutWrapper>} />
       <Route path="/PostarNoticiasIA" element={<LayoutWrapper currentPageName="PostarNoticiasIA"><React.Suspense fallback={null}>{React.createElement(React.lazy(() => import('@/pages/PostarNoticiasIA')))}</React.Suspense></LayoutWrapper>} />
       <Route path="/GerenciarNoticias2" element={<LayoutWrapper currentPageName="GerenciarNoticias2"><React.Suspense fallback={null}>{React.createElement(React.lazy(() => import('@/pages/GerenciarNoticias2')))}</React.Suspense></LayoutWrapper>} />
       <Route path="/generarnoticiasia" element={<Navigate to="/GerenciarNoticias2" replace />} />
       <Route path="/ForgotPassword" element={<LayoutWrapper currentPageName="ForgotPassword"><ForgotPasswordPage /></LayoutWrapper>} />
       <Route path="/ResetPassword" element={<LayoutWrapper currentPageName="ResetPassword"><ResetPasswordPage /></LayoutWrapper>} />
+      <Route path="/:specialSlug" element={<SpecialLinkEntry />} />
       <Route path="*" element={<PageNotFound />} />
     </Routes>
   );
 };
 
 
 function App() {
 
   return (
     <AuthProvider>
       <QueryClientProvider client={queryClientInstance}>
         <Router>
           <NavigationTracker />
           <AuthenticatedApp />
         </Router>
         <Toaster />
         <VisualEditAgent />
       </QueryClientProvider>
     </AuthProvider>
   )
 }
 
 export default App
\ No newline at end of file
 
EOF
)
