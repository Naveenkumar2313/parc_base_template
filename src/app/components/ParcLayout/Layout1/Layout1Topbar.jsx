import { memo } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import styled from "@mui/material/styles/styled";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import Home from "@mui/icons-material/Home";
import Menu from "@mui/icons-material/Menu";
import Person from "@mui/icons-material/Person";
import Settings from "@mui/icons-material/Settings";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Tooltip from "@mui/material/Tooltip";
import WebAsset from "@mui/icons-material/WebAsset";
import MailOutline from "@mui/icons-material/MailOutline";
import StarOutline from "@mui/icons-material/StarOutline";
import PowerSettingsNew from "@mui/icons-material/PowerSettingsNew";

// import useAuth from "app/hooks/useAuth"; // Removed
import useSettings from "app/hooks/useSettings";
import { NotificationProvider } from "app/contexts/NotificationContext";
import Brand from "app/components/Brand";

import { Span } from "app/components/Typography";
// import ShoppingCart from "app/components/ShoppingCart"; // Removed
import { ParcMenu, ParcSearchBox } from "app/components";
import { NotificationBar } from "app/components/NotificationBar";
import { themeShadows } from "app/components/ParcTheme/themeColors";
import { topBarHeight } from "app/utils/constant";

// STYLED COMPONENTS
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.primary
}));

const ThemeToggleButton = styled(IconButton)(({ theme }) => ({
  borderRadius: '12px',
  padding: 10,
  width: 48,
  height: 48,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: 'none',
  boxShadow: 'none',
  '& .MuiSvgIcon-root': {
    fontSize: '28px'
  },
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  }
}));

const TopbarRoot = styled("div")({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 96,
  height: topBarHeight,
  boxShadow: themeShadows[8],
  transition: "all 0.3s ease"
});

const TopbarContainer = styled("div")(({ theme }) => ({
  padding: "8px",
  paddingLeft: 18,
  paddingRight: 20,
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
  [theme.breakpoints.down("sm")]: { paddingLeft: 16, paddingRight: 16 },
  [theme.breakpoints.down("xs")]: { paddingLeft: 14, paddingRight: 16 }
}));

const BrandContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginRight: "auto"
}));

const UserMenu = styled("div")({
  padding: 4,
  display: "flex",
  borderRadius: 24,
  cursor: "pointer",
  alignItems: "center",
  "& span": { margin: "0 8px" }
});

const StyledItem = styled(MenuItem)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  minWidth: 185,
  "& a": {
    width: "100%",
    display: "flex",
    alignItems: "center",
    textDecoration: "none"
  },
  "& span": { marginRight: "10px", color: theme.palette.text.primary }
}));

const IconBox = styled("div")(({ theme }) => ({
  display: "inherit",
  [theme.breakpoints.down("md")]: { display: "none !important" }
}));

const Layout1Topbar = () => {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  // const { logout, user } = useAuth(); // Removed
  const isMdScreen = useMediaQuery(theme.breakpoints.down("md"));

  const isDarkMode = theme.palette.mode === 'dark' ||
    settings.activeTheme?.includes('Dark') ||
    settings.theme?.palette?.type === 'dark' ||
    false;

  const toggleTheme = () => {
    const currentTheme = settings.activeTheme;
    const isDark = currentTheme.includes('Dark') || currentTheme === 'slateDark1' || currentTheme === 'slateDark2';
    const newTheme = isDark ? 'blue' : 'blueDark';

    updateSettings({
      activeTheme: newTheme,
      themes: {
        ...settings.themes,
        [newTheme]: {
          ...settings.themes[newTheme],
          palette: {
            ...settings.themes[newTheme].palette,
            mode: isDark ? 'light' : 'dark',
            background: {
              paper: isDark ? '#fff' : '#1a2038',
              default: isDark ? '#fafafa' : '#0f172a'
            },
            text: {
              primary: isDark ? 'rgba(0, 0, 0, 0.87)' : '#fff',
              secondary: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)'
            },
            divider: isDark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
            action: {
              active: isDark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
              hover: isDark ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
              selected: isDark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
              disabled: isDark ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
              disabledBackground: isDark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'
            }
          }
        }
      }
    });
  };

  const updateSidebarMode = (sidebarSettings) => {
    updateSettings({ layout1Settings: { leftSidebar: { ...sidebarSettings } } });
  };

  const handleSidebarToggle = () => {
    let { layout1Settings } = settings;
    let currentMode = layout1Settings.leftSidebar.mode;
    let newMode;
    
    if (currentMode === "full") {
      newMode = "compact";
    } else if (currentMode === "compact") {
      newMode = "full";
    } else {
      newMode = "full";
    }
    
    updateSidebarMode({ mode: newMode });
  };

  // Static user placeholder
  const user = { name: "User", avatar: "" };
  const logout = () => {};

  return (
    <TopbarRoot>
      <TopbarContainer>
        <Box display="flex" alignItems="center">
          <StyledIconButton onClick={handleSidebarToggle}>
            <Menu />
          </StyledIconButton>
          
          <BrandContainer>
            <Brand />
          </BrandContainer>
        </Box>

        <Box display="flex" alignItems="center">
          <ParcSearchBox />

          <Tooltip title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}>
            <ThemeToggleButton onClick={toggleTheme} color="inherit">
              {isDarkMode ? <Brightness4Icon /> : <Brightness7Icon />}
            </ThemeToggleButton>
          </Tooltip>

          <NotificationProvider>
            <NotificationBar />
          </NotificationProvider>

          {/* <ShoppingCart /> Removed */}

          <ParcMenu
            menuButton={
              <UserMenu>
                <Span>
                  Hi <strong>{user.name}</strong>
                </Span>

                <Avatar src={user.avatar} sx={{ cursor: "pointer" }} />
              </UserMenu>
            }>
            <StyledItem>
              <Link to="/">
                <Home />
                <Span sx={{ marginInlineStart: 1 }}>Home</Span>
              </Link>
            </StyledItem>

            <StyledItem>
              {/* Profile item, no redirect */}
              <Person />
              <Span sx={{ marginInlineStart: 1 }}>Profile</Span>
            </StyledItem>

            <StyledItem>
              <Settings />
              <Span sx={{ marginInlineStart: 1 }}>Settings</Span>
            </StyledItem>

            <StyledItem onClick={logout}>
              <PowerSettingsNew />
              <Span sx={{ marginInlineStart: 1 }}>Logout</Span>
            </StyledItem>
          </ParcMenu>
        </Box>
      </TopbarContainer>
    </TopbarRoot>
  );
};

export default memo(Layout1Topbar);
