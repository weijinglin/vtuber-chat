import 'antd/dist/antd.css';
import {Avatar, Image, Modal, Select} from "antd";
import React from 'react';

const { Option } = Select;

export function ChoiceDialog(props) {

    return (
        <>
            {/*<Button type="primary" onClick={showModal}>*/}
            {/*    Open Modal*/}
            {/*</Button>*/}
            <Modal title="choice your visual model" visible={props.show} onOk={props.onok} onCancel={props.oncancel}
                   okText="ok" cancelText="cancel">
                <Select
                    showSearch
                    placeholder="Select a person"
                    optionFilterProp="children"
                    onChange={props.onchange}
                    filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                >
                    <Option value="first"><Avatar
                        src={
                            <Image
                                src={require("../assets/sun.png")}
                                style={{
                                    width: 32,
                                }}
                            />
                        }
                    /></Option>
                    <Option value="second"><Avatar
                        src={
                            <Image
                                src={require("../assets/girl.png")}
                                style={{
                                    width: 32,
                                }}
                            />
                        }
                    /></Option>
                    <Option value="third"><Avatar
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