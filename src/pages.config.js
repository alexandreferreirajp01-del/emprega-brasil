import Splash from './pages/Splash';
import Register from './pages/Register';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Groups from './pages/Groups';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Feed from './pages/Feed';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Splash": Splash,
    "Register": Register,
    "Home": Home,
    "Jobs": Jobs,
    "JobDetail": JobDetail,
    "Groups": Groups,
    "Subscription": Subscription,
    "Profile": Profile,
    "Admin": Admin,
    "Feed": Feed,
}

export const pagesConfig = {
    mainPage: "Splash",
    Pages: PAGES,
    Layout: __Layout,
};