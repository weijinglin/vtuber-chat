import { Button, Modal } from 'antd';
import React, {useEffect, useState} from 'react';
import 'antd/dist/antd.css';


const RejectDialog = (props) => {
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

    return (
        <>
            {/*<Button type="primary" onClick={showModal}>*/}
            {/*    Open Modal*/}
            {/*</Button>*/}
            <Modal title="counterpart reject" visible={props.show} onOk={props.onok}
                   okText="ok">
                <p>Some contents...</p>
                {/*<p>Some contents...</p>*/}
                {/*<p>Some contents...</p>*/}
            </Modal>
        </>
    );
};

export default RejectDialog;