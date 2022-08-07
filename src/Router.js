import React from "react";
import {Router, Route, Routes, BrowserRouter, Link} from 'react-router-dom'


export class BasicRoute extends React.Component{
    render() {
        return(
            <BrowserRouter>
                <Route exact path="/" />}/>
            </BrowserRouter>
        )
    }
}
