import Splash from './pages/Splash';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Groups from './pages/Groups';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Feed from './pages/Feed';
import Community from './pages/Community';
import PendingAccess from './pages/PendingAccess';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Splash": Splash,
    "Home": Home,
    "Jobs": Jobs,
    "JobDetail": JobDetail,
    "Groups": Groups,
    "Subscription": Subscription,
    "Profile": Profile,
    "Admin": Admin,
    "Feed": Feed,
    "Community": Community,
    "PendingAccess": PendingAccess,
    "News": News,
    "NewsDetail": NewsDetail,
    "Privacy": Privacy,
    "Terms": Terms,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Splash",
    Pages: PAGES,
    Layout: __Layout,
};