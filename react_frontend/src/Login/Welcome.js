import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { Link } from "react-router-dom";
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
// import { Bar, Chart } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, useTheme } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { CHART_DATA } from '../utility/URL'
import RequireAuth from "../utility/RequireAuth";
import axios from 'axios';
import { useOutletContext } from "react-router-dom";
import Chart from "react-apexcharts";
import D3Chart from '../Sunburst/D3Chart';










const drawerWidth = 240;


const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        '& .MuiDrawer-paper': {
            position: 'relative',
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            boxSizing: 'border-box',
            ...(!open && {
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    width: theme.spacing(9),
                },
            }),
        },
    }),
);

// const mdTheme = createTheme();

function DashboardContent() {
    const { setTitle } = useOutletContext();
    const [open, setOpen] = React.useState(true);
    const [mapping, setMapping] = React.useState({})
    const [instance, setInstance] = React.useState("")
    const [stream, setStream] = React.useState([])
    const [counts, setCounts] = React.useState([])
    const [data, setData] = React.useState({})
    const { authTokens, loading } = React.useContext(RequireAuth)


    const theme = useTheme();


    const getMapping = () => {

        axios({
            method: "get",
            url: CHART_DATA,
            headers: {
                "Authorization": 'Bearer ' + String(authTokens.access),
            },
        })
            .then((response) => {
                // console.log(response)
                console.log("Success", console.log(response.data.data.allData));
                setMapping(response.data.data.mapping)
                // for (const [key, value] of Object.entries(response.data.data.record_count)) {
                //     setInstance(key)
                //     setStream(Object.keys(value))
                //     setCounts(Object.values(value))
                // }
                setData(response.data.data.allData)

            })
            .catch((error) => {
                // logoutUser();
                console.log("Error!", error);
            });

    }

    React.useEffect(() => (getMapping(), setTitle("DashBoard")), [])





    const chartData1 = {
        options: {
            title: {
                text: "InstanceCount vs Taps",
            },
            plotOptions: {
                bar: {
                    borderRadius: 5,
                    columnWidth: '40%',
                }
            },
            chart: {
                id: "basic-bar"
            },
            xaxis: {
                title: {
                    text: "taps",
                    offsetY: -20,
                },
                categories: Object.keys(mapping)
            },

            yaxis: {
                tickAmount: 2,
                title: {
                    text: "instance count",

                },
            }
        },
        series: [
            {
                name: "instance",
                data: Object.values(mapping)
            }
        ]
    }



    const chartData2 = {
        options: {
            plotOptions: {
                bar: {
                    borderRadius: 5,
                    columnWidth: '40%',
                }
            },
            chart: {
                id: "basic-bar"
            },
            xaxis: {
                title: {
                    text: instance,
                    offsetY: -5,
                },
                categories: stream
            },

            yaxis: {
                tickAmount: 2
            }
        },
        series: [
            {
                name: "count",
                data: counts
            }
        ]
    }

    const toggleDrawer = () => {
        setOpen(!open);
    };

    console.log('My data --->', data)
    return (
        <>
            <Grid container spacing={4} columns={16} >
                <Grid item xs={10}>
                    <Card sx={{
                        boxShadow: 10,
                    }}>

                        <CardContent>
                            <Box
                                sx={{
                                    height: 800,
                                    position: 'relative',
                                }}
                            >
                                {Object.keys(data).length ?
                                    <>

                                        <strong>
                                            All Taps Sync Data
                                            <hr />
                                        </strong>
                                        <D3Chart data={data} />
                                    </>
                                    : <h1>No sync data available    </h1>
                                }

                            </Box>
                        </CardContent>

                    </Card>
                </Grid>
                <Grid item xs={6}>

                    <Card sx={{ boxShadow: 10 }} >

                        <CardContent>
                            <Box
                                sx={{
                                    position: 'relative'
                                }}
                            >
                                <Chart
                                    options={chartData1.options}
                                    series={chartData1.series}
                                    type="bar"

                                />
                            </Box>
                        </CardContent>

                    </Card>
                </Grid>
                {/* <Grid item xs={6} md={10}>
                    <D3Chart />
                </Grid> */}
            </Grid>
        </>
    );
}

export default DashboardContent;