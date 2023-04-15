import { useState, useEffect, useContext } from 'react';
import { useOutletContext, useNavigate } from "react-router-dom";
import { Collapse, SpeedDial, SpeedDialIcon, SpeedDialAction, Box, Grid, Fab, CircularProgress, Typography } from '@mui/material';
import Discover from './Discovery';
import FieldSelection from './FieldSelection';
import State from './State';
import Sync from './Sync';
import downArrow from "../assets/rightArrow.gif"
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import BugReportIcon from '@mui/icons-material/BugReport';
import AlignVerticalTopIcon from '@mui/icons-material/AlignVerticalTop';
import { CircularProgressProps } from '@mui/material/CircularProgress';
import { APICall, SweetAlertPopUp } from '../utility/utils';
import { COVERAGE_DATA_URL } from '../utility/URL';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import RequireAuth from "../utility/RequireAuth";


const style = {
    coverage: {
        margin: 0,
        top: 'auto',
        right: 20,
        bottom: 120,
        left: 'auto',
        position: 'fixed',
    }
};

const Pipeline = () => {
    const { setTitle } = useOutletContext();
    const [pipeline, setPipeline] = useState({ field_selection: false, state: false, sync: false, is_state: false });
    const [open, setOpen] = useState(false);
    const [pylintRate, setPylintRate] = useState("");
    const [coverage, setCoverage] = useState("Coverage")
    const [show, setShow] = useState(false)
    const { user, authTokens } = useContext(RequireAuth);


    const CircularProgressWithLabel = (props: CircularProgressProps & { value: number },) => {
        return (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                {
                    isNaN(props.value) ? <CircularProgress /> :
                        props.value != "" ? <CircularProgress variant="determinate" {...props} /> : <></>
                    // <AlignVerticalTopIcon /> 
                }
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        component="div"
                        color="text.secondary"
                    >
                        {
                            isNaN(props.value) ? <AlignVerticalTopIcon /> :
                                props.value != "" ? `${props.data}` :
                                    <AlignVerticalTopIcon />
                        }
                    </Typography>
                </Box>
            </Box>
        );
    }

    const actions = [
        {
            icon: <CircularProgressWithLabel value={pylintRate * 10} data={pylintRate} />,
            name: 'Pylint',
            onclick: () => {
                setPylintRate("hello");
                CoverageFind("pylint");
            }
        },
        {
            icon: show ? <CircularProgress /> : isNaN(coverage) ? <BugReportIcon /> : <CircularProgressWithLabel value={coverage} data={coverage + "%"} />,
            name: 'Unit Tests',
            onclick: () => {
                setCoverage("coverage");
                CoverageFind("Unit Tests");
            }
        },
    ];

    useEffect(() => {
        setTitle("Talend Stitch Tap Pipeline");
    }, []);

    const CoverageFind = (name) => {
        if (name == "Unit Tests") {
            setShow(true);
        }
        APICall({
            method: 'get',
            url: COVERAGE_DATA_URL,
            headers: {
                "Authorization": 'Bearer ' + String(authTokens.access),
            },
            params: {
                instance_name: window.location.href.split("pipeline/")[1].split("/")[0],
                tap_name: window.location.href.split("pipeline/")[1].split("/")[1],
                name: name,
            },
            successCallBack: (data) => {
                console.log('Coverage data received... ')
                if (name == "pylint") {
                    setPylintRate(parseFloat(data.result.split("/")[0]));
                }
                if (name == "Unit Tests") {
                    setCoverage(parseFloat(data.result));
                    window.open(`${window.location.pathname.replace("pipeline", "pipeline/coverage")}/${name}`);
                }
                setShow(false);
            },
            errorCallBack: (error) => {
                setPylintRate(0);
                setShow(false);
                setCoverage("coverage");
                SweetAlertPopUp({
                    title: "Error in " + name + " execution",
                    text: error.response.data.message,
                    icon: "error",
                    buttons: [false, "Yes"],
                    yesOnClick: () => { }
                });
            }
        });
    }

    return (
        <>
            <Grid container>
                {/* <Grid item xs={1}>
                <Box >
                    <SpeedDial
                        direction='down'
                        ariaLabel="SpeedDial controlled open example"
                        FabProps={{
                            style: {background: 'linear-gradient(to bottom, #0A1F2A, #5BB4F3)'},
                            onClick: ()=>{
                                if(!open){
                                    CoverageFind("pylint");
                                }
                                setOpen(!open);
                            }
                        }}
                        icon={<AlignVerticalTopIcon />}
                        open={open}
                    >
                        {
                            actions.map((action) => (
                                <SpeedDialAction
                                    key={action.name}
                                    icon={action.icon}
                                    tooltipTitle={action.name}
                                    onClick={action.onclick}

                                />
                            ))
                        }
                        
                    </SpeedDial>
                </Box>
            </Grid> */}

                <Grid item xs={2}>
                    <Discover change={setPipeline} />
                </Grid>

                <Grid item xs={1}>
                    <Box sx={{ width: '50%' }}>
                        <Collapse orientation="horizontal" timeout={1000} in={pipeline.field_selection}>
                            <Box sx={{ mt: 3 }} style={{ height: 5, width: "12.5vw", background: "linear-gradient(-365deg, #3e970c, transparent)" }}></Box>
                        </Collapse>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <FieldSelection pipeline={pipeline} change={setPipeline} />
                </Grid>

                <Grid item xs={1}>
                    <Box sx={{ width: '50%' }}>
                        <Collapse orientation="horizontal" timeout={1000} in={pipeline.state}>
                            <Box sx={{ mt: 3 }} style={{ height: 5, width: "12.5vw", background: "linear-gradient(-365deg, #3e970c, transparent)" }}></Box>
                        </Collapse>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <State pipeline={pipeline} change={setPipeline} />
                </Grid>

                <Grid item xs={1}>
                    <Box sx={{ width: '50%' }}>
                        <Collapse orientation="horizontal" timeout={1000} in={pipeline.sync}>
                            <Box sx={{ mt: 3 }} style={{ height: 5, width: "12.5vw", background: "linear-gradient(-365deg, #3e970c, transparent)" }}></Box>
                        </Collapse>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <Sync pipeline={pipeline} change={setPipeline} />
                </Grid>

                <Grid item xs={1}>
                    <Box >
                        <SpeedDial
                            direction='down'
                            ariaLabel="SpeedDial controlled open example"
                            FabProps={{
                                style: { background: 'linear-gradient(to bottom, #0A1F2A, #5BB4F3)' },
                                onClick: () => {
                                    // if (!open) {
                                    //     CoverageFind("pylint");
                                    // }
                                    setOpen(!open);
                                }
                            }}
                            icon={<AlignHorizontalRightIcon />}
                            open={open}
                        >
                            {
                                actions.map((action) => (
                                    <SpeedDialAction
                                        key={action.name}
                                        icon={action.icon}
                                        tooltipTitle={action.name}
                                        onClick={action.onclick}

                                    />
                                ))
                            }

                        </SpeedDial>
                    </Box>
                </Grid>


            </Grid>

        </>
    );
}

export default Pipeline
