import { Button, Modal } from 'antd';
import React, {useEffect, useState} from 'react';
import 'antd/dist/antd.css';


const Dialog = (props) => {
    // const [isModalVisible, setIsModalVisible] = useState(props.show);

    // const showModal = () => {
    //     setIsModalVisible(true);
    // };

    // const handleOk = () => {
    //     setIsModalVisible(false);
    // };
    //
    // const handleCancel = () => {
    //     setIsModalVisible(false);
    // };

    useEffect(()=>{
        console.log("debug");
        console.log(props.show);
        console.log("test");
    },[])

    return (
        <>
            {/*<Button type="primary" onClick={showModal}>*/}
            {/*    Open Modal*/}
            {/*</Button>*/}
            <Modal title="Basic Modal" visible={props.show} onOk={props.onok} onCancel={props.oncancel}>
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Modal>
        </>
    );
};

export default Dialog;