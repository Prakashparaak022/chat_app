import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import LogoutIcon from "@mui/icons-material/Logout";

const pages = ["Products", "Pricing", "Blog"];
const settings = ["Profile", "Account", "Dashboard", "Logout"];

function Navbar(props) {
  const { setAvatar } = props;

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Prakash">
              <IconButton sx={{ p: 0, paddingLeft: "1rem" }}>
                <Avatar
                  alt="Prakash Avatar"
                  src={setAvatar}
                  sx={{ width: 45, height: 45 }}
                />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                textAlign: "center",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "1.8rem",
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}>
              Prakash
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button variant="outlined" color="inherit" endIcon={<LogoutIcon />}>
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;
