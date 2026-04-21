import { memo } from "react";
import { styled, alpha } from "@mui/material/styles";
import useTheme from "@mui/material/styles/useTheme";

import useSettings from "app/hooks/useSettings";
import Sidenav from "app/components/Sidenav";
import { themeShadows } from "app/components/ParcTheme/themeColors";
import { sidenavCompactWidth, sideNavWidth, topBarHeight } from "app/utils/constant";

// STYLED COMPONENTS
const SidebarNavRoot = styled("div", {
  shouldForwardProp: (prop) => !["width", "bg", "image"].includes(prop)
})(({ theme, width, image }) => ({
  position: "fixed",
  top: topBarHeight,
  left: 0,
  height: `calc(100vh - ${topBarHeight}px)`,
  width: width,
  boxShadow: themeShadows[8],
  backgroundRepeat: "no-repeat",
  backgroundPosition: "top",
  backgroundSize: "cover",
  zIndex: 11111111,
  overflow: "hidden",
  color: theme.palette.text.primary,
  transition: "all 250ms ease-in-out",
  background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.96)}, ${alpha(
    theme.palette.primary.main,
    0.96
  )}), url(${image})`,
  "&:hover": {
    width: sideNavWidth,
    "& .sidenavHoverShow": { display: "block" },
    "& .compactNavItem": {
      width: "100%",
      maxWidth: "100%",
      "& .nav-bullet": { display: "block" },
      "& .nav-bullet-text": { display: "none" }
    }
  }
}));

const NavListBox = styled("div")({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  paddingTop: "20px"
});

const Layout1Sidenav = () => {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  const leftSidebar = settings.layout1Settings.leftSidebar;
  const { mode, bgImgURL } = leftSidebar;

  const getSidenavWidth = () => {
    if (mode === "compact") return sidenavCompactWidth;
    return sideNavWidth;
  };

  const updateSidebarMode = (sidebarSettings) => {
    updateSettings({ layout1Settings: { leftSidebar: { ...sidebarSettings } } });
  };

  return (
    <SidebarNavRoot image={bgImgURL} width={getSidenavWidth()}>
      <NavListBox>
        <Sidenav />
      </NavListBox>
    </SidebarNavRoot>
  );
};

export default memo(Layout1Sidenav);
