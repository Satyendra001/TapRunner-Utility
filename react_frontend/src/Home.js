import React, { useContext, useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import TableRowsIcon from '@mui/icons-material/TableRows';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HomeIcon from '@mui/icons-material/Home';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import LoaderGif from "./assets/loader.gif"
import GifLoader from 'react-gif-loader';
import { APICall } from "./utility/utils";
import { ACTIVE_USER, USER_LOGOUT } from "./utility/URL";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import RequireAuth from "./utility/RequireAuth";


// import WelcomePage from "./Login/Welcome";

// const stringToColor = (string) => {
//   let hash = 0;
//   let i;

//   /* eslint-disable no-bitwise */
//   for (i = 0; i < string.length; i += 1) {
//     hash = string.charCodeAt(i) + ((hash << 5) - hash);
//   }

//   let color = '#';

//   for (i = 0; i < 3; i += 1) {
//     const value = (hash >> (i * 8)) & 0xff;
//     color += `00${value.toString(16)}`.slice(-2);
//   }
//   /* eslint-enable no-bitwise */

//   return color;
// }

const stringAvatar = (name) => {
  return {
    sx: {
      background: "linear-gradient(-514deg, rgb(6 5 5), transparent)",
    },
    children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
  };
}

const Home = () => {
  const [open, setOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [loader, setLoader] = useState(false);
  const [userName, setUserName] = useState('Satyendra Singh')
  const [title, setTitle] = useState("")
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const cookies = new Cookies();
  const navigate = useNavigate();

  const { user, logoutUser } = useContext(RequireAuth)
  var username = user.username.toUpperCase();
  console.log(username)
  username = username.split('_').join(' ');

  const handleLogout = () => {
    APICall({
      method: 'post',
      url: USER_LOGOUT,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": cookies.get('csrftoken'),
      },
      credentials: "same-origin",
      successCallBack: (data) => {
        console.log(data);
        setAnchorElUser(null)
        window.location.reload()
      }
    })
  }

  const getLoggedUser = () => {
    APICall({
      method: 'get',
      url: ACTIVE_USER,
      successCallBack: (data) => {
        var username = data.success.toUpperCase();
        username = username.split('_').join(' ');

        setUserName(username);

      },

      errorCallBack: (data) => {
        console.log(data)
      }
    })

  }
  const toggleSlider = () => {
    setOpen(!open);
  };

  // useEffect(getLoggedUser, [])

  const sideList = () => (
    <Box component="div"
      onClick={toggleSlider}>
      <Divider />
      <List >
        <ListItem button key="Home" onClick={() => setTitle("Talend-Stitch Tap Runner")} component={Link} to="/home" >
          <ListItemIcon>
            <HomeIcon sx={{ ml: "15px" }} />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <Divider />
        <ListItem button key="Instances" component={Link} to="/tap">
          <ListItemIcon>
            <TableRowsIcon sx={{ ml: "15px" }} />
          </ListItemIcon>
          <ListItemText primary="Instances" />
        </ListItem>
        <Divider />
      </List>
    </Box>
  );

  return (

    <>
      <GifLoader
        loading={loader}
        imageSrc={LoaderGif}
        imageStyle={{
          marginTop: "20px",
          marginRight: "70px",
          padding: "20%"
        }}
        overlayBackground="rgba(0,0,0,0.5)"
        height="100%"

      />
      <CssBaseline />

      <Box component="nav" >
        <AppBar position="static" style={{ background: 'linear-gradient(to bottom, #0A1F2A, #5BB4F3)', color: "white", height: "60px" }}>
          <Toolbar>
            <IconButton
              onClick={toggleSlider}
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar {...stringAvatar(username)} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >

                <MenuItem onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={logoutUser}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>

              </Menu>
            </Box>
            <Drawer open={open} anchor="left" onClose={toggleSlider}>
              {sideList()}
            </Drawer>
          </Toolbar>
        </AppBar>
        <Box sx={{ m: 3 }}>
          <Outlet context={{
            setLoader, setTitle
          }} />
        </Box>
      </Box>
    </>

  );
}

export default Home;

