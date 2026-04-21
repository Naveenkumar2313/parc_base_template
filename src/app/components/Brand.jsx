import Box from "@mui/material/Box";
import styled from "@mui/material/styles/styled";

import { Span } from "./Typography";
import { ParcLogo } from "app/components";
import useSettings from "app/hooks/useSettings";

// STYLED COMPONENTS
const BrandRoot = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 18px 20px 29px"
}));

const StyledSpan = styled(Span)(() => ({
  fontSize: 18,
  marginLeft: ".5rem",
  display: "block"
}));

export default function Brand({ children }) {
  return (
    <BrandRoot>
      <Box display="flex" alignItems="center">
        <img src="/favicon.ico" width={32} height={32} alt="PyGenicArc" />
        <StyledSpan className="sidenavHoverShow">
          PyGenicArc
        </StyledSpan>
      </Box>

      <Box className="sidenavHoverShow">
        {children || null}
      </Box>
    </BrandRoot>
  );
}
