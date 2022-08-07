import logo from './logo.svg';
import './App.css';
import {Cameraview} from "./view/cameraview";
import {VtubchatView} from "./view/VtubchatView";
import {ChoiceView} from "./view/ChoiceView";
import {BasicRoute} from "./Router";

function App() {
  return (
    //
    //   <Cameraview></Cameraview>
      <BasicRoute></BasicRoute>
  );
}

export default App;
