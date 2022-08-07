import React from "react";
import {Router, Route, Routes, BrowserRouter, Link} from 'react-router-dom'
import {ChoiceView} from "./view/ChoiceView";
import {Cameraview} from "./view/cameraview";
import {VtubchatView} from "./view/VtubchatView";


export class BasicRoute extends React.Component{
    render() {
        return(
            <BrowserRouter>
                <Routes>
                    <Route exact path="/"  element={<ChoiceView/>}/>
                    <Route exact path="/simple"  element={<Cameraview/>}/>
                    <Route exact path="/vtuber"  element={<VtubchatView/>}/>
                </Routes>
            </BrowserRouter>
        )
    }
}
