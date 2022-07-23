import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import 'antd/dist/antd.css';


const Dialog = (props) => {
    const [isModalVisible, setIsModalVisible] = useState(props.show);

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

    return (
        <>
            {/*<Button type="primary" onClick={showModal}>*/}
            {/*    Open Modal*/}
            {/*</Button>*/}
            <Modal title="Basic Modal" visible={isModalVisible} onOk={props.onok} onCancel={props.oncancel}>
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Modal>
        </>
    );
};

export default Dialog;