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
import Payment from './pages/Payment';
import Parcerias from './pages/Parcerias';
import PostarVaga from './pages/PostarVaga';
import VagasPorIA from './pages/VagasPorIA';
import VagasHomeOffice from './pages/VagasHomeOffice';
import Favoritos from './pages/Favoritos';
import Historico from './pages/Historico';
import ActivateBasic from './pages/ActivateBasic';
import ProfessionalResume from './pages/ProfessionalResume';
import RecruiterArea from './pages/RecruiterArea';
import Social from './pages/Social';
import ExploreUsers from './pages/ExploreUsers';
import SocialProfile from './pages/SocialProfile';
import DirectMessages from './pages/DirectMessages';
import PostDetail from './pages/PostDetail';
import EditProfile from './pages/EditProfile';
import Notifications from './pages/Notifications';
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
    "Payment": Payment,
    "Parcerias": Parcerias,
    "PostarVaga": PostarVaga,
    "VagasPorIA": VagasPorIA,
    "VagasHomeOffice": VagasHomeOffice,
    "Favoritos": Favoritos,
    "Historico": Historico,
    "ActivateBasic": ActivateBasic,
    "ProfessionalResume": ProfessionalResume,
    "RecruiterArea": RecruiterArea,
    "Social": Social,
    "ExploreUsers": ExploreUsers,
    "SocialProfile": SocialProfile,
    "DirectMessages": DirectMessages,
    "PostDetail": PostDetail,
    "EditProfile": EditProfile,
    "Notifications": Notifications,
}

export const pagesConfig = {
    mainPage: "Splash",
    Pages: PAGES,
    Layout: __Layout,
};