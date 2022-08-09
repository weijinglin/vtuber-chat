import 'antd/dist/antd.css';
import {Avatar, Image, Modal, Select} from "antd";
import React from 'react';

const { Option } = Select;

export function ChoiceDialog(props) {

    const onChange = (value) => {
        console.log(`selected ${value}`);
    };


    return (
        <>
            {/*<Button type="primary" onClick={showModal}>*/}
            {/*    Open Modal*/}
            {/*</Button>*/}
            <Modal title="Accept a call" visible={props.show} onOk={props.onok} onCancel={props.oncancel}
                   okText="receive" cancelText="reject">
                <Select
                    showSearch
                    placeholder="Select a person"
                    optionFilterProp="children"
                    onChange={onChange}
                    filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                >
                    <Option value="jack"><Avatar
                        src={
                            <Image
                                src={require("../assets/sun.png")}
                                style={{
                                    width: 32,
                                }}
                            />
                        }
                    /></Option>
                    <Option value="lucy"><Avatar
                        src={
                            <Image
                                src={require("../assets/girl.png")}
                                style={{
                                    width: 32,
                                }}
                            />
                        }
                    /></Option>
                    <Option value="tom"><Avatar
                        src={
                            <Image
                                src={require("../assets/magic.png")}
                                style={{
                                    width: 32,
                                }}
                            />
                        }
                    /></Option>
                </Select>
            </Modal>
        </>
    );
}