import {Link, useNavigate} from "react-router-dom";
import {Button} from "antd";

export function ChoiceView(props) {

    const navigate = useNavigate();

    const simpleHandle = () => {
        navigate("/simple");
    }

    const vtubHandle = () => {
        navigate("/vtuber");
    }

    return(
        <div>
            <div className="buttondiv">
                <Button className="choice" onClick={simpleHandle}>
                    simple-chat
                </Button>
            </div>
            <div className="buttondiv">
                <Button className="choice" onClick={vtubHandle}>
                    vtub-chat
                </Button>
            </div>
        </div>
    )
}