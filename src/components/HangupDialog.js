import { Button, Modal } from 'antd';
import React, {useEffect, useState} from 'react';
import 'antd/dist/antd.css';


const HangupDialog = (props) => {
    useEffect(()=>{
        console.log("debug");
        console.log(props.show);
    },[])

    return (
        <>
            {/*<Button type="primary" onClick={showModal}>*/}
            {/*    Open Modal*/}
            {/*</Button>*/}
            <Modal title="counterpart hangup" visible={props.show} onOk={props.onok}
                   okText="ok">
                <p>Some contents...</p>
                {/*<p>Some contents...</p>*/}
                {/*<p>Some contents...</p>*/}
            </Modal>
        </>
    );
};

export default HangupDialog;