import { Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import leftLandingLeave from "../../assets/b_leaf_l.svg";
import rightLandingLeave from "../../assets/b_leaf_r.svg";
import ImageCarousel from "../../components/ImageCarousel";
import LoginForm from "./LoginForm";
import useCurrentUser from "../../hooks/useCurrentUser";
import PageLoader from "../../components/PageLoader";
import { useLocation, useNavigate } from "react-router";
import index1 from "../../assets/new1.png";
import index2 from "../../assets/new2.png";
import index3 from "../../assets/new3.png";

function LoginPage() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));
  const navigate = useNavigate();
  const location = useLocation();

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
            backgroundColor: "#f2f2f2",
            height: isMdUp ? "100vh" : "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ImageCarousel
            images={[
              { src: index1, alt: "Welcome" },
              { src: index2, alt: "Health & Safety" },
              { src: index3, alt: "Employee Engagement" },
            ]}
          />
          <Typography
            variant={isMdUp ? "h2" : "h3"}
            sx={{
              fontWeight: "700",
              color: "#525252",
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
              color: "#525252",
              margin: "1rem",
              textAlign: "center",
            }}
          >
            copyright © 2025 Sky Smart Technology, All Rights Reserved
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "400",
              color: "#525252",
              textAlign: "center",
              marginLeft: "3rem",
              marginRight: "3rem",
              marginBottom: "2rem",
            }}
          >
            Our dedicated teams of engineers, architects, and tech consultants
            are here to support your bold ideas, guide you through our
            cutting-edge solutions, and provide answers to your technical and
            business questions. Let's build smarter, together.
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