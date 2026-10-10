import { Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import leftLandingLeave from "../../assets/b_leaf_l.svg";
import rightLandingLeave from "../../assets/b_leaf_r.svg";
import ImageCarousel from "../../components/ImageCarousel";
import LoginForm from "./LoginForm";
import useCurrentUser from "../../hooks/useCurrentUser";
import PageLoader from "../../components/PageLoader";
import { useLocation, useNavigate } from "react-router";
import { useLoginSlideshowImages } from "../../hooks/useLoginSlideshowImages";

function LoginPage() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));
  const navigate = useNavigate();
  const location = useLocation();
  const slideshowImages = useLoginSlideshowImages();

  const { user, status } = useCurrentUser();

  useEffect(() => {
    if (user) {
      // Always navigate to dashboard when user is already logged in
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (status === "loading" || status === "idle") {
    return <PageLoader />;
  }

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflowY: "hidden ",
      }}
    >
      <Stack
        direction={isMdUp ? "row" : "column"}
        sx={{ width: "100%", overflowY: "auto" }}
      >
        <Stack
          sx={{
            flex: isMdUp ? 3 : 1,
            backgroundColor: theme.palette.mode === "dark" ? "#0f172a" : "#f2f2f2",
            height: isMdUp ? "100vh" : "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ImageCarousel images={slideshowImages} />
          <Typography
            variant={isMdUp ? "h2" : "h3"}
            sx={{
              fontWeight: "700",
              color: theme.palette.mode === "dark" ? "#f8fafc" : "#525252",
              marginTop: "1rem",
              marginLeft: "1rem",
              marginRight: "1rem",
              textAlign: "center",
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "600",
              color: theme.palette.mode === "dark" ? "#cbd5e1" : "#525252",
              margin: "1rem",
              textAlign: "center",
            }}
          >
            copyright © 2026 DIO SOLUTIONS, All Rights Reserved
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "400",
              color: theme.palette.mode === "dark" ? "#cbd5e1" : "#525252",
              textAlign: "center",
              marginLeft: "3rem",
              marginRight: "3rem",
              marginBottom: "2rem",
            }}
          >
            Our comprehensive ERP platform streamlines your business operations, seamlessly integrating financials, inventory, and supply chain management. Gain real-time insights and unparalleled control to drive efficiency across your entire organization. Let's grow smarter, together.
          </Typography>
        </Stack>
        <Stack sx={{ flex: isMdUp ? 2 : 1 }}>
          <LoginForm />
        </Stack>
      </Stack>
      <img
        src={leftLandingLeave}
        alt="Logo"
        width={150}
        height={150}
        style={{ position: "absolute", left: 0, bottom: -5, zIndex: 10 }}
      />
      <img
        src={rightLandingLeave}
        alt="Logo"
        width={150}
        height={150}
        style={{ position: "absolute", right: 0, bottom: -20, zIndex: 10 }}
      />
    </Stack>
  );
}

export default LoginPage;