import { Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import leftLandingLeave from "../../assets/b_leaf_l.svg";
import rightLandingLeave from "../../assets/b_leaf_r.svg";
import ImageCarousel from "../../components/ImageCarousel";
import LoginForm from "./LoginForm";
import useCurrentUser from "../../hooks/useCurrentUser";
import PageLoader from "../../components/PageLoader";
import { useLocation, useNavigate } from "react-router";
import index1 from "../../assets/645bd8c2478c94d2d379d7388b069fad.png";
import index2 from "../../assets/2016e0ff123f8731d5507f751adbb24d.png";
import index3 from "../../assets/58629c28c29af472c2e7f5a7527ec6af.png";
import index4 from "../../assets/99925897a696e03d965d544901fc8746.png";
import index5 from "../../assets/e2104bc248c4786a229b9a5cf8b00b1c.png";
import index6 from "../../assets/f7f7e9ff7fbd9f51474d40d41eb11867.png";

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
              { src: index1, alt: "Slide 1" },
              { src: index2, alt: "Slide 2" },
              { src: index3, alt: "Slide 3" },
              { src: index4, alt: "Slide 4" },
              { src: index5, alt: "Slide 5" },
              { src: index6, alt: "Slide 6" },
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
            copyright © 2026 DIO SOLUTIONS, All Rights Reserved
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