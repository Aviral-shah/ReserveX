import mainLogo from "../../assets/main-icon.png";
import { FaSearch, FaUser } from "react-icons/fa";
import { useLocation } from "../../context/LocationContext";
import map from "../../assets/pin.gif";
import { useNavigate, useParams } from "react-router-dom";
import SignInModel from "./SignInModel";
import { useAuth } from "../../context/AuthContext";

const Header = () => {

  const { location, loading, error } = useLocation();
   const { toggleModal, auth, user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="w-full text-sm bg-white border-b border-gray-100">
      {/* Top Navbar */}
      <div className="px-3 sm:px-4 md:px-8">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center py-2.5 md:py-3 gap-2.5 md:gap-4">
          
          {/* Top Row: Logo & Search on desktop, or Logo + User Action on mobile */}
          <div className="flex items-center justify-between md:justify-start w-full md:w-auto space-x-3 md:space-x-4">
            <img
              onClick={() => navigate("/")}
              src={mainLogo}
              alt="RESERVEX logo"
              className="h-9 sm:h-10 md:h-12 object-contain cursor-pointer shrink-0"
            />

            {/* Desktop Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search for Movies, Events, Plays, Sports and Activities"
                className="border border-gray-300 rounded px-4 py-1.5 w-[300px] lg:w-[420px] text-sm outline-none focus:border-[#f84464]"
              />
              <FaSearch className="absolute right-3 top-2.5 text-gray-400" />
            </div>

            {/* Mobile Location & Sign In (top right on mobile) */}
            <div className="flex md:hidden items-center space-x-2 shrink-0">
              <div className="text-xs font-medium cursor-pointer">
                {loading && <img src={map} alt="loading..." className="w-6 h-6 inline" />}
                {location && <p className="text-gray-700">{location} ▼</p>}
              </div>

              {auth ? (
                <div
                  onClick={() => navigate(`/profile/${user?._id}/profile`)}
                  className="flex items-center space-x-1 cursor-pointer bg-gray-100 px-2 py-1 rounded-full text-xs font-medium"
                >
                  <FaUser className="text-gray-600 text-xs" />
                  <span className="truncate max-w-[70px]">
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => toggleModal()}
                  className="bg-[#f84464] cursor-pointer text-white px-3 py-1 rounded text-xs font-medium shadow-sm"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search Bar (full-width row on mobile) */}
          <div className="relative block md:hidden w-full">
            <input
              type="text"
              placeholder="Search for Movies, Events, Plays..."
              className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 w-full text-xs outline-none focus:bg-white focus:border-[#f84464]"
            />
            <FaSearch className="absolute right-3 top-2 text-gray-400 text-xs" />
          </div>

          {/* Desktop Right Part (Location + Sign in / Profile) */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-sm font-medium cursor-pointer">
              {loading && <img src={map} alt="loading..." className="w-8 h-8 inline" />}
              {location && <p className="text-gray-700">{location} &nbsp; ▼</p>}
            </div>
            {auth ? (
              <div
                className="flex items-center space-x-2 cursor-pointer hover:text-red-500"
                onClick={() => navigate(`/profile/${user?._id}/profile`)}
              >
                <span className="text-sm font-medium border rounded-full border-gray-300 p-2">
                  <FaUser className="text-gray-500" />
                </span>
                <span className="text-sm font-medium">
                  Hi, {user ? user?.name : "User"} &nbsp; ▼
                </span>
              </div>
            ) : (
              <button
                onClick={() => toggleModal()}
                className="bg-[#f84464] cursor-pointer text-white px-4 py-1.5 rounded text-sm hover:bg-[#e03a58] transition"
              >
                Sign in
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Navbar */}
      <div className="bg-[#f2f2f2] px-3 sm:px-4 md:px-8 border-t border-gray-200">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center py-2 text-gray-700">
          {/* Scrollable categories on mobile */}
          <div className="flex items-center space-x-4 sm:space-x-6 font-medium text-xs sm:text-sm overflow-x-auto scrollbar-hide py-0.5 w-full md:w-auto">
            <span onClick={() => navigate("/movies")} className="cursor-pointer hover:text-red-500 whitespace-nowrap">Movies</span>
            <span className="cursor-pointer hover:text-red-500 whitespace-nowrap">Stream</span>
            <span className="cursor-pointer hover:text-red-500 whitespace-nowrap">Events</span>
            <span className="cursor-pointer hover:text-red-500 whitespace-nowrap">Plays</span>
            <span className="cursor-pointer hover:text-red-500 whitespace-nowrap">Sports</span>
            <span className="cursor-pointer hover:text-red-500 whitespace-nowrap">Activities</span>
          </div>

          {/* Desktop only secondary links */}
          <div className="hidden md:flex items-center space-x-6 text-sm shrink-0">
            <span className="cursor-pointer hover:underline whitespace-nowrap">ListYourShow</span>
            <span className="cursor-pointer hover:underline whitespace-nowrap">Corporates</span>
            <span className="cursor-pointer hover:underline whitespace-nowrap">Offers</span>
            <span className="cursor-pointer hover:underline whitespace-nowrap">Gift Cards</span>
          </div>
        </div>
      </div>
      <SignInModel />
    </div>
  );
};

export default Header;
