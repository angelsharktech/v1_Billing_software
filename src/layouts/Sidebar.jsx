import React, { useEffect, useState, useRef } from "react";
import {
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  Inventory2 as Inventory2Icon,
  ReceiptLong as ReceiptLongIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrganizationById } from "../services/Organization";
import { getUserById } from "../services/UserService";

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  {
    label: "Bills",
    icon: <ReceiptLongIcon />,
    subItems: [
      "Sale Bill (ALT+S)",
      "Purchase Bill (ALT+P)",
      "Sale Return (ALT+S+R)",
      "Purchase Return (ALT+P+R)",
    ],
  },
  { label: "Suppliers", icon: <StoreIcon /> },
  { label: "Customer", icon: <PeopleIcon /> },
  { label: "Category", icon: <CategoryIcon /> },
  { label: "Product", icon: <Inventory2Icon /> },
  {
    label: "Reports",
    icon: <AssessmentIcon />,
    subItems: ["Purchase Report", "Sale Report", "Expense", "Income", "Profit & Loss"],
  },
  {
    label: "Payment",
    icon: <CurrencyRupeeIcon />,
    subItems: ["Payment Given", "Payment Received"],
  },
  {
    label: "Ledger",
    icon: <CreditScoreIcon />,
    subItems: ["Supplier Ledger", "Customer Ledger"],
  },
  { label: "Quotation", icon: <Inventory2Icon /> },
];

const Sidebar = ({ selectedTab, setSelectedTab, sidebarOpen, setSidebarOpen }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [org, setOrg] = useState({ name: "", logo: "" });
  const { webuser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const refs = useRef({});

  const toggleDrawer = () => {
    if (setSidebarOpen) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  useEffect(() => {
    const fetchOrganization = async () => {
      const res = await getUserById(webuser.id);
      const result = await getOrganizationById(res.organization_id._id);
      setOrg({
        name: result.name || "",
        logo: result.logo
          ? `${import.meta.env.VITE_API_BASE_URL}${result.logo?.replace(
              /\\/g,
              "/"
            )}`
          : "",
      });
    };
    fetchOrganization();
  }, [webuser]);

  const handleNavClick = (label) => {
    if (label === "Logout") {
      logoutUser();
      navigate("/login");
    } else {
      setSelectedTab(label);
    }
    if (isMobile && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleDropdownClick = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const getVisibleItems = () => {
    const visible = [];
    navItems.forEach((item) => {
      visible.push(item.label);
      if (item.subItems && openDropdown === item.label) {
        item.subItems.forEach((sub) => visible.push(sub));
      }
    });
    return visible;
  };

  const handleKeyDown = (e, label) => {
    const visibleItems = getVisibleItems();
    const index = visibleItems.indexOf(label);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % visibleItems.length;
      const nextLabel = visibleItems[nextIndex];
      const nextRef = refs.current[nextLabel];
      nextRef?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + visibleItems.length) % visibleItems.length;
      const prevLabel = visibleItems[prevIndex];
      const prevRef = refs.current[prevLabel];
      prevRef?.focus();
    }
  };

  // Responsive width function
  const getSidebarWidth = () => {
    if (isMobile) return 224; // 56 * 4 = 224px for mobile
    
    const width = window.innerWidth;
    if (width < 900) return 180; // 240px for small desktop
    if (width < 1200) return 200; // 280px for medium desktop
    if (width < 1536) return 240; // 300px for large desktop
    return 320; // 320px for extra large desktop
  };

  const getFontSize = () => {
    const width = window.innerWidth;
    if (isMobile) return "text-xs";
    if (width < 900) return "text-sm";
    if (width < 1200) return "text-base";
    if (width < 1536) return "text-base";
    return "text-lg";
  };

  const getIconSize = () => {
    const width = window.innerWidth;
    if (isMobile) return "text-lg";
    if (width < 900) return "text-xl";
    if (width < 1200) return "text-2xl";
    return "text-2xl";
  };

  const getLogoSize = () => {
    const width = window.innerWidth;
    if (isMobile) return "w-16 h-16";
    if (width < 900) return "w-20 h-20";
    if (width < 1200) return "w-24 h-24";
    return "w-28 h-28";
  };

  const getPadding = () => {
    if (isMobile) return "px-3";
    return "px-4";
  };

  const renderSidebarContent = () => {
    const fontSize = getFontSize();
    const iconSize = getIconSize();
    const logoSize = getLogoSize();
    const padding = getPadding();
    const sidebarWidth = getSidebarWidth();

    return (
      <div
        className={`
          ${padding}
          bg-gradient-to-br from-[#182848] to-[#324b84]
          text-white
          h-screen
          pt-8
          flex
          flex-col
          gap-4
          rounded-tr-[40px]
          rounded-br-[60px]
          fixed
          overflow-hidden
          ${isMobile ? '' : 'mt-12'}
        `}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex flex-col items-center">
          <img
            src={org.logo}
            alt="Logo"
            className={`
              ${logoSize}
              object-contain
              rounded-2xl
              mb-6
            `}
          />
          <div className="text-center w-full px-2">
            <p className={`${fontSize} font-semibold truncate`}>
              {org.name}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isSelected = selectedTab === item.label;
              const isDropdownOpen = openDropdown === item.label;

              if (item.subItems) {
                return (
                  <li key={item.label}>
                    <button
                      ref={(el) => (refs.current[item.label] = el)}
                      onClick={() => handleDropdownClick(item.label)}
                      onKeyDown={(e) => handleKeyDown(e, item.label)}
                      className={`
                        w-full
                        flex
                        items-center
                        justify-between
                        p-3
                        rounded-lg
                        transition-all
                        duration-200
                        ${isSelected 
                          ? "bg-white text-[#182848] font-semibold shadow-md" 
                          : "text-white hover:bg-white hover:text-[#182848]"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${iconSize} ${isSelected ? "text-[#182848]" : "text-white"}`}>
                          {item.icon}
                        </div>
                        <span className={`${fontSize} truncate`}>
                          {item.label}
                        </span>
                      </div>
                      <div className={`${iconSize} ${isSelected ? "text-[#182848]" : "text-white"}`}>
                        {isDropdownOpen ? <ExpandLess /> : <ExpandMore />}
                      </div>
                    </button>

                    {isDropdownOpen && (
                      <div className="pl-4 mt-1 space-y-1">
                        {item.subItems.map((subLabel) => (
                          <button
                            key={subLabel}
                            ref={(el) => (refs.current[subLabel] = el)}
                            onClick={() => handleNavClick(subLabel)}
                            onKeyDown={(e) => handleKeyDown(e, subLabel)}
                            className={`
                              w-full
                              text-left
                              p-2
                              pl-6
                              rounded-lg
                              transition-all
                              duration-200
                              ${selectedTab === subLabel
                                ? "bg-white text-[#182848] font-semibold shadow-md"
                                : "text-white hover:bg-white hover:text-[#182848]"
                              }
                            `}
                          >
                            <span className={`${fontSize} truncate`}>
                              {subLabel}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              } else {
                return (
                  <li key={item.label}>
                    <button
                      ref={(el) => (refs.current[item.label] = el)}
                      onClick={() => handleNavClick(item.label)}
                      onKeyDown={(e) => handleKeyDown(e, item.label)}
                      className={`
                        w-full
                        flex
                        items-center
                        gap-3
                        p-3
                        rounded-lg
                        transition-all
                        duration-200
                        ${isSelected
                          ? "bg-white text-[#182848] font-semibold shadow-md"
                          : "text-white hover:bg-white hover:text-[#182848]"
                        }
                      `}
                    >
                      <div className={`${iconSize} ${isSelected ? "text-[#182848]" : "text-white"}`}>
                        {item.icon}
                      </div>
                      <span className={`${fontSize} truncate`}>
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              }
            })}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <>
      {isMobile ? (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: getSidebarWidth(),
              borderRadius: '0 0 60px 0',
              overflow: 'hidden',
            }
          }}
        >
          {renderSidebarContent()}
        </Drawer>
      ) : (
        <div className="h-screen z-10">
          {renderSidebarContent()}
        </div>
      )}
    </>
  );
};

export default Sidebar;