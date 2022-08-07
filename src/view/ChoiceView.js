import {Link} from "react-router-dom";
import {Button} from "antd";

export function ChoiceView(props) {

    return(
        <div>
            <div>
                <Button className="choice">
                    simple-chat
                </Button>
            </div>
            <div>
                <Button className="choice">
                    vtub-chat
                </Button>
            </div>
        </div>
    )
}