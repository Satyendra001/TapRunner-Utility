import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import Card from '@mui/material/Card';
import { CardContent } from "@mui/material";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button'
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FlatList from 'flatlist-react';
import { TAP_SETUP_URL } from '../utility/URL'
import { APICall } from '../utility/utils';
import CreateIcon from '@mui/icons-material/Create';
import { SweetAlertPopUp } from '../utility/utils';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import ContentLoader from "react-content-loader"
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { useOutletContext } from "react-router-dom";
import Tooltip from '@mui/material/Tooltip';
import CompareIcon from '@mui/icons-material/Compare';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Switch from "@mui/material/Switch";
import Slide from "@mui/material/Slide";
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
import FormControlLabel from "@mui/material/FormControlLabel";
import RequireAuth from "../utility/RequireAuth";
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import Zoom from '@mui/material/Zoom';


const style = {
    new_setup: {
        margin: 0,
        top: 'auto',
        right: 20,
        bottom: 20,
        left: 'auto',
        position: 'fixed',
        background: "linear-gradient(rgb(10, 31, 42), rgb(91, 180, 243))",
        color: "white"
    },
    compare: {
        position: 'fixed',
        top: 'auto',
        right: -50,
        bottom: 100,
        left: 'auto',
    }
}


export default function TapInstance() {
    const { setTitle } = useOutletContext();
    const [data, setData] = useState([]);
    const [show, SetShow] = useState(false);
    const [searchData, setSearchData] = useState("");
    const [checked, setChecked] = React.useState({});
    const [disableCard, setDisableCard] = useState({});
    const [flag, setFlag] = useState(false);
    const [compare, setCompare] = React.useState(false);
    const containerRef = React.useRef(null);

    const navigate = useNavigate();
    const { authTokens, loading } = useContext(RequireAuth)

    const FloatingCompare = () => {
        var url = "/#"
        var data = Object.entries(checked).filter(x => x[1] == true);
        if (data.length == 2) {
            url = `compare/${data[0][0]}&${data[1][0]}`
        }
        return (
            <Box style={style.compare}>
                <Fab
                    component={Link}
                    to={url}
                    target="_blank"
                    color="primary"
                    sx={{
                        m: 1,
                        width: 172,
                        height: 50,
                        borderLeft: 1,
                        border: 0,
                        bgcolor: "#3467C1",
                        borderRadius: "150px 0 0 150px",
                    }}
                    elevation={4}
                >
                    <Fab size="small" aria-label="add" style={{ margin: 0, right: -5 }} >
                        <CompareIcon />
                    </Fab>
                    <Typography component="p" style={{ marginRight: "auto", paddingLeft: 7 }}>
                        Compare
                    </Typography>

                </Fab>
            </Box>
        )
    }

    const getUserInstance = () => {
        APICall({
            method: 'get',
            url: TAP_SETUP_URL,
            headers: {
                "Authorization": 'Bearer ' + String(authTokens.access),
            },
            successCallBack: (data) => {
                setData(data.data);
                SetShow(true);

            },
            errorCallBack: (data) => {
                window.location.reload();
            }
        });
    }

    const handleDelete = (instance_name, tap_name) => {
        APICall({
            method: 'delete',
            url: TAP_SETUP_URL,
            headers: {
                "Authorization": 'Bearer ' + String(authTokens.access),
            },
            data: { "instance_name": instance_name, "tap_name": tap_name },
            successCallBack: (data) => {
                window.location.reload();
            }
        });
    }

    const callDelete = (instance_name, tap_name) => {
        SweetAlertPopUp({
            title: "Are you sure?",
            text: "The instance shall be deleted",
            icon: "warning",
            buttons: ["No", "Yes"],
            yesOnClick: () => {
                handleDelete(instance_name, tap_name);
            }
        });
    }

    const Loader = props => {
        return (
            <ContentLoader
                speed={2}
                height={400}
                viewBox="10 0 550 150"
                backgroundColor="#d9d9d9"
                foregroundColor="#ededed"
                {...props}
            >
                <rect x="40" y="30" rx="4" ry="4" width="500" height="20" />
                <rect x="40" y="55" rx="4" ry="4" width="500" height="20" />
                <rect x="40" y="80" rx="4" ry="4" width="500" height="20" />
                <rect x="40" y="105" rx="4" ry="4" width="500" height="20" />
                <rect x="40" y="130" rx="4" ry="4" width="500" height="20" />
            </ContentLoader>
        )
    }

    const handleSearchChange = (event) => {
        setSearchData(event.target.value);
    }

    const handleCheckChange = (event) => {
        setFlag(event.target.checked);
        setChecked({ ...checked, [event.target.name]: event.target.checked });
    }

    const updateDisable = () => {
        const obj = {}
        for (const property of data) {
            if ((property.instance_name in checked) && checked[property.instance_name]) {
                obj[property.tap_name] = checked[property.instance_name];
            }
            else if (!(property.tap_name in obj)) obj[property.tap_name] = false;
        }
        setDisableCard(obj);
    }

    const searchTap = () => {
        if (!searchData) return data

        else {
            return data.filter(tap_data => (tap_data.instance_name.includes(searchData)))
        }
    }

    useEffect(() => {
        getUserInstance();
        setTitle("Instances List");
        updateDisable();
        if (flag && Object.values(checked).filter(x => (x == true)).length == 2) {
            setCompare(true);
        }
        else {
            setCompare(false);
        }
    }, [checked]);


    const renderTap = (tap, idx) => {
        let data = `Discover: ${tap.catalog_m_time} \n Sync: ${tap.sync_m_time}`
        return (
            <Card sx={{ display: 'flex', margin: "10px", borderRadius: "10px", height: 60, boxShadow: 10 }}
                key={idx}
                style={Boolean((Object.values(checked).filter(val => val == true)).length) ? {
                    backgroundColor: disableCard[tap.tap_name] ? '' : "grey"
                } : {}
                }
            >
                <Checkbox
                    size="small"
                    name={tap.instance_name}
                    value={checked[tap.instance_name]}
                    onChange={handleCheckChange}
                    disabled={Boolean((Object.values(checked).filter(val => val == true)).length) && !disableCard[tap.tap_name]}
                />

                <CardContent sx={{ flex: '1 0 auto', p: "1px" }}>
                    <Typography component="div" variant="h6">
                        {tap.instance_name}
                        {<Tooltip
                            title={<div style={{ whiteSpace: 'pre-line' }}>{data}</div>}
                            placement="right-start"
                            arrow
                            TransitionComponent={Zoom}
                        >

                            <HelpOutlineOutlinedIcon variant="outlined" fontSize="small" color="white" sx={{ ml: 1, pt: "3px" }} />
                        </Tooltip>}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div">
                        {tap.tap_name}
                    </Typography>
                </CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', m: "10px" }} spacing={12}>
                    <Tooltip title="Delete Instance">
                        <Button variant="outlined" sx={{ mr: 2, borderRadius: "150px 0 0 150px" }} disabled={Boolean((Object.values(checked).filter(val => val == true)).length) && !disableCard[tap.tap_name]} startIcon={<DeleteIcon />} onClick={() => callDelete(tap.instance_name, tap.tap_name)}>
                            Delete
                        </Button>
                    </Tooltip>
                    <Tooltip title="Edit Instance">
                        <Button component={Link} sx={{ mr: 2 }} to={`/tap/update/${tap.instance_name}`} variant="outlined" startIcon={<CreateIcon />} disabled={Boolean((Object.values(checked).filter(val => val == true)).length) && !disableCard[tap.tap_name]}>
                            Edit
                        </Button>
                    </Tooltip>
                    <Tooltip title="Run Instance">
                        <Button component={Link} sx={{ mr: 2 }} to={`/pipeline/${tap.instance_name}/${tap.tap_name}`} variant="outlined" startIcon={<ElectricBoltIcon />} disabled={Boolean((Object.values(checked).filter(val => val == true)).length) && !disableCard[tap.tap_name]}>
                            Run
                        </Button>
                    </Tooltip>
                    <Tooltip title="Show Report">
                        <Button component={Link} sx={{ borderRadius: "0 150px 150px 0" }} to={`/pipeline/${tap.instance_name}/${tap.tap_name}/report`} variant="outlined" startIcon={<AssessmentOutlinedIcon />} disabled={Boolean((Object.values(checked).filter(val => val == true)).length) && !disableCard[tap.tap_name]}>
                            Report
                        </Button>
                    </Tooltip>
                </Box>

            </Card >
        );
    }

    return (
        <>{
            show ?
                <>

                    <Box sx={{ m: 3 }}  >

                        <TextField
                            fullWidth id="outlined-search"
                            placeholder="Search Instances"
                            type="search"
                            onChange={handleSearchChange}
                            InputProps={{
                                style: { borderRadius: "500px" },
                                startAdornment: (
                                    <InputAdornment position="start" >
                                        <IconButton>
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <FlatList
                            list={searchTap()}
                            renderItem={renderTap}
                            renderWhenEmpty={() => <><div style={{ width: 1000, marginLeft: 650 }}>No Instance Data Available</div><hr /></>}
                        />

                        <Link to="/tap/create">
                            <Tooltip title="Create new Instance">
                                <Fab aria-label="add" style={style.new_setup} size="large">
                                    <AddIcon />
                                </Fab>
                            </Tooltip>
                        </Link>

                        <Box>
                            <Slide direction="left" in={compare} container={containerRef.current}>
                                {FloatingCompare()}
                            </Slide>
                        </Box>

                    </Box >
                </>

                : <Loader />
        }
        </>
    )

}


