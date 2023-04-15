import React from "react";
import Button from '@mui/material/Button';
import { useState, useEffect, useContext } from 'react';
import { TAP_SETUP_URL } from '../utility/URL'
import { APICall } from '../utility/utils';
import { SweetAlertPopUp } from '../utility/utils';
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';
import Dropzone from 'react-dropzone';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import GifLoader from 'react-gif-loader';
import LoaderGif from "../assets/loader.gif"
import UploadIcon from '../assets/upload-cloud.svg'
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import moment from 'moment'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useOutletContext } from "react-router-dom";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { FormHelperText } from '@mui/material';
import Select from '@mui/material/Select';
import axios from 'axios';
import Cookies from "universal-cookie";
import RequireAuth from "../utility/RequireAuth";



const styles = {
    p1: {
        fontFamily: 'Jost',
        marginTop: '1rem',
        marginBottom: '0.5rem',
        color: '#646464'
    },

    uploadContainer: {
        border: '1px dashed #C4C4C4',
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'center',
        height: '6rem',
        width: '100%',
        backgroundColor: '#FFFFFF',
        padding: '1rem'
    },
}


const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    <Typography component={'span'}>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}



const Form = () => {
    const { setLoader, setTitle } = useOutletContext();
    const [tap, setTap] = useState({ "tap_name": "", "instance_name": "", "branch_name": "" });
    const [showConfigEntries, setShowConfigEntries] = useState(false);
    const [disable, setDisable] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [config, setConfig] = useState({});
    const [file, setFile] = useState(null);
    const [value, setValue] = useState(0);
    const [branches, setBranches] = useState([]);
    const [branch, setBranch] = useState("");
    const [showGetBranch, setShowGetBranch] = useState(true);
    const [error, setError] = useState({ "tap_name": "", "instance_name": "", "branch_name": "" })

    const url = window.location.href;
    const check_string = "/tap/update";
    const navigate = useNavigate();
    const cookies = new Cookies();

    const { authTokens } = useContext(RequireAuth)

    const handleChange = (event, newValue) => setValue(newValue);

    const cloneRepo = () => {
        if (validate()) {
            setLoader(true)
            APICall({
                method: 'post',
                url: TAP_SETUP_URL,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + String(authTokens.access),
                },
                data: tap,
                successCallBack: (data) => {
                    console.log("Success")
                    if (data.config) {
                        setConfig(data.config)

                    }
                    setTap(data.data)
                    setShowCreate(false)
                    setLoader(false)
                    setShowConfigEntries(true)
                    cloneSuccessPopUp(data.msg)
                }
            });
        }
    }

    const writeConfig = () => {
        let data = new FormData()
        data.append('tap_info', JSON.stringify(tap));
        if (value == 0) {
            data.append('config', JSON.stringify(config));
            data.append('is_upload', 'no');
        }
        else if (value == 2) {
            if (!jsonValidator()) {
                SweetAlertPopUp({
                    title: " Instance Creation Message",
                    text: "Invalid JSON... Please Re-enter the json",
                    icon: "error",
                    yesOnClick: () => { }

                });

                return
            }

            data.append('config', config);
            data.append('is_upload', 'no');

        }
        else {
            data.append('config', file);
            data.append('is_upload', 'yes');
        }
        console.log(data)
        setLoader(true)

        APICall({
            method: 'patch',
            url: TAP_SETUP_URL,
            headers: {
                "Content-Type": "application/json",
                "Authorization": 'Bearer ' + String(authTokens.access),
            },
            data: data,
            successCallBack: (data) => {
                console.log(data.msg)
                setLoader(false)
                redirectOnOkClick(data.msg)


            },
            errorCallBack: () => {
                setLoader(false)
                SweetAlertPopUp({
                    title: "Error while Installing Dependencies... Try Another Tap",
                    icon: "error",
                    yesOnClick: () => { navigate('/tap'); }

                });
            }
        });
    }

    const updateUserInstance = (data) => {
        setShowGetBranch(false)
        APICall({
            method: 'put',
            url: TAP_SETUP_URL,
            headers: {
                "Content-Type": "application/json",
                "Authorization": 'Bearer ' + String(authTokens.access),
            },
            data: data,
            successCallBack: (data) => {
                setConfig(data.config)
                setTap(data.tap_data)
                setShowConfigEntries(true)
                setShowCreate(false)
                setDisable(true)
            }
        });
    }

    const validate = () => {
        let data = {
            tap_name: tap.tap_name === "" ? "This field is required" : "",
            instance_name: tap.instance_name === "" ? "This field is required" : !tap.instance_name.match(/^[a-z0-9-_]+$/i) ? "Instance name should have Alphanumeric characters" : "",
            branch_name: !showGetBranch && tap.branch_name === "" ? "This field is required" : ""
        }
        setError(data);
        return !(Boolean(data.tap_name) || Boolean(data.instance_name) || Boolean(data.branch_name))

    }

    useEffect(() => {
        if (url.includes(check_string)) {
            const url_list = url.split("/")
            updateUserInstance({ "instance_name": url_list.pop() })
            setTitle("Edit Config Data")
        }
        else { setTitle("Instance Creation") }
    }, [])

    const cloneSuccessPopUp = (data) => {
        SweetAlertPopUp({
            title: " Instance Creation Message",
            text: data,
            icon: "success",
            yesOnClick: () => { }

        });
    }
    const redirectOnOkClick = (data) => {
        console.log(data)
        SweetAlertPopUp({
            title: " Instance Creation Message",
            text: data,
            icon: "success",
            yesOnClick: () => {
                navigate('/tap');
            }

        });
    }

    const handleBranchClick = (tap_name) => {
        if (validate()) {
            fetch(`https://api.github.com/repos/singer-io/${tap_name}/branches`)
                .then((response) => {
                    if (response.ok) { return response.json() }
                    throw new Error("Tap not found")
                })
                .then((result) => {
                    console.log('****', result)
                    if (!result.includes('master')) {
                        result.push({ name: 'master' })
                    }
                    setShowGetBranch(false)
                    const arr = result.map(obj => (
                        <MenuItem value={obj.name} key={obj.name}>{obj.name}</MenuItem>
                    ))
                    setBranches(arr)
                    setShowCreate(true)
                })
                .catch((error) => {
                    console.log('Error!', error)
                    const msg = error + "... Try Again!!"
                    SweetAlertPopUp({
                        title: msg,
                        icon: "error",
                        yesOnClick: () => { }

                    })
                });
            // axios({
            //     method: 'get',
            //     url: `https://api.github.com/repos/singer-io/${tap_name}/branches`,
            // })
            //     .then((response) => {
            //         setShowGetBranch(false)
            //         const arr = response.data.map(obj => (
            //             <MenuItem value={obj.name} key={obj.name}>{obj.name}</MenuItem>
            //         ))
            //         setBranches(arr)
            //         setShowCreate(true)
            //     })
            //     .catch((error) => {
            //         // config.errorCallBack(error.response)
            //         console.log("Error!", error.response);
            //         const msg = "Entered tap " + error.response.data.message + "... Try Again!!"
            //         SweetAlertPopUp({
            //             title: msg,
            //             icon: "error",
            //             yesOnClick: () => { }

            //         });
            //     });

            // GetBranch({
            //     method: 'get',
            //     url: `https://api.github.com/repos/singer-io/${tap_name}/branches/`,
            //     successCallBack: (data) => {
            //         setShowGetBranch(false)
            //         const arr = data.map(obj => (
            //             <MenuItem value={obj.name} key={obj.name}>{obj.name}</MenuItem>
            //         ))
            //         setBranches(arr)
            //         setShowCreate(true)


            //     },
            //     errorCallBack: (error) => {
            //         const msg = "Entered tap " + error.data.message + "... Try Again!!"
            //         SweetAlertPopUp({
            //             title: msg,
            //             icon: "error",
            //             yesOnClick: () => { }

            //         });

            //     }
            // });
        }
    }

    const jsonValidator = () => {
        try {
            JSON.parse(config);
        } catch (e) {
            return false
        }
        return true
    }

    return (

        <Box sx={{ display: 'flex', flexWrap: 'wrap' }} >
            <TextField
                error={error.tap_name !== ""}
                helperText={error.tap_name}
                id="tap_name"
                value={tap['tap_name']}
                onChange={(e) => {
                    if (showCreate) {
                        setShowGetBranch(true)
                        setShowCreate(false)
                    }
                    setTap({ ...tap, [e.target.name]: e.target.value })
                }}
                label="Tap-Name"
                name="tap_name"
                disabled={disable}
                fullWidth
                sx={{ m: 1 }}

            />
            <TextField
                error={error.instance_name !== ""}
                helperText={error.instance_name}
                id="instance_name"
                value={tap['instance_name']}
                onChange={(e) => {
                    if (showCreate) {
                        setShowGetBranch(true);
                        setShowCreate(false);
                    }
                    setTap({ ...tap, [e.target.name]: e.target.value });
                }

                }

                label="Instance Name"
                name="instance_name"
                disabled={disable}
                fullWidth
                sx={{ m: 1 }}
            />
            <Button variant="contained" fullWidth sx={{ m: 1 }} onClick={() => handleBranchClick(tap.tap_name)} style={{ display: showGetBranch ? 'block' : 'none' }}>Get Branches</Button>

            <FormControl fullWidth sx={{ m: 1 }} style={{ display: showGetBranch ? 'none' : "" }}>
                <InputLabel id="demo-simple-select-label"  >Select Branch</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    defaultValue="master"
                    value={branch}
                    error={error.branch_name !== ""}
                    label="Select Branch"
                    disabled={disable}
                    onChange={(e) => (setBranch(e.target.value), setTap({ ...tap, "branch_name": e.target.value }))}
                >
                    {branches}
                </Select>
                <FormHelperText error>{error.branch_name}</FormHelperText>
            </FormControl>

            <Button variant="contained" fullWidth sx={{ mr: 1, ml: 1 }} onClick={cloneRepo} style={{ display: showCreate ? '' : 'none' }}>Create</Button>

            <Box sx={{ mt: 1 }} style={{ display: showConfigEntries ? 'block' : 'none', width: "100%" }}>

                <Divider style={{ color: "black" }}>
                    <strong>
                        CONFIG
                    </strong>
                </Divider>
                <Tabs value={value} onChange={handleChange} aria-label="Create Config file" centered>
                    <Tab label="Fill value in existing Config" {...a11yProps(0)} />
                    <Tab label="Upload Config json" {...a11yProps(1)} />
                    <Tab label="Enter Custom Config json" {...a11yProps(2)} />
                </Tabs>
                <TabPanel value={value} index={0}>
                    {Object.keys(config).map(key => {

                        if (key === "start_date") {
                            return (
                                <LocalizationProvider dateAdapter={AdapterDateFns} key={key}>
                                    <DateTimePicker
                                        inputFormat="dd MMM yyyy, h:mm:ss"
                                        value={moment(config[key])}
                                        onChange={(e) => { console.log(e); setConfig({ ...config, ["start_date"]: moment.utc(e).format() }) }}
                                        label={key}
                                        name={key}
                                        renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 1 }} />}
                                    />
                                </LocalizationProvider>
                            )
                        }

                        else return (
                            <FormControl fullWidth sx={{ mt: 2 }} key={key}>
                                <InputLabel htmlFor="outlined-adornment-amount">{key}</InputLabel>
                                <OutlinedInput
                                    id="outlined-adornment-amount"
                                    value={config[key]}
                                    onChange={(e) => setConfig({ ...config, [e.target.name]: e.target.value })}
                                    label={key}
                                    name={key}
                                />
                            </FormControl>
                        );
                    })}
                </TabPanel>
                <TabPanel value={value} index={1}>
                    <p style={styles.p1}>Upload files</p>
                    <Dropzone onDrop={acceptedFiles => setFile(acceptedFiles[0])}>
                        {({ getRootProps, getInputProps }) => (
                            <section >
                                <div {...getRootProps()}>
                                    <label htmlFor="upload-photo">
                                        <div style={styles.uploadContainer}>
                                            {file === null ?
                                                <>
                                                    <img src={UploadIcon} width="24px" alt="upload icon" />
                                                    <p style={styles.p2} >Upload Config json</p>
                                                </> :
                                                <p>{`Uploaded file ${file.name}`}</p>

                                            }
                                        </div>
                                    </label><br />
                                    <input {...getInputProps()} />
                                </div>
                            </section>
                        )}
                    </Dropzone>
                </TabPanel>
                <TabPanel value={value} index={2}>
                    <TextField
                        id="outlined-textarea"
                        label="Enter Config Here"
                        placeholder="{...}"
                        multiline
                        rows={4}
                        fullWidth
                        sx={{ mt: 5 }}
                        onChange={(e) => setConfig(e.target.value)}
                    />
                </TabPanel>
                <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={writeConfig} >Save</Button>
            </Box>


        </Box>
    )
}

export default Form;