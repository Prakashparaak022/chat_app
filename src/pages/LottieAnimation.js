import { useState, useEffect } from "react";
import { Box, Grid2 as Grid } from "@mui/material";
import Lottie from "lottie-react";

export const LottieAnimation = (props) => {
  const { animationList, animationText } = props;
  const [currentAnimation, setCurrentAnimation] = useState(0);

  useEffect(() => {
    if (currentAnimation >= animationList?.length) {
      setCurrentAnimation(0);
    }
  }, [currentAnimation, animationList]);

  const handleAnimation = () => {
    setCurrentAnimation((prev) => prev + 1);
  };

  if (!animationList?.length) return null;

  return (
    <Grid
      style={{
        background: "rgba(0, 0 , 0, 0)",
        padding: "10px",
      }}>
      <Box>
        <Lottie
          animationData={animationList[currentAnimation]}
          loop={false}
          onComplete={handleAnimation}
        />
      </Box>
      <p
        style={{
          textAlign: "center",
          marginTop: "-10px",
          color: "rgba(255, 215, 0, 1)",
          fontWeight: "bold",
          fontSize: "20px",
          textShadow: "2px 1.2px 2px rgba(255, 0, 0, 1)",
        }}>
        {animationText}
      </p>
    </Grid>
  );
};
