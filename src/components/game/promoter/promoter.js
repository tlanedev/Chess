import React from 'react';
import { Square } from "../board/board.js";

import blackbishop from "../../../images/chesspieces/blackbishop.svg";
import blackrook from "../../../images/chesspieces/blackrook.svg";
import blackknight from "../../../images/chesspieces/blackknight.svg";
import blackqueen from "../../../images/chesspieces/blackqueen.svg";

import whitebishop from "../../../images/chesspieces/whitebishop.svg";
import whiterook from "../../../images/chesspieces/whiterook.svg";
import whiteknight from "../../../images/chesspieces/whiteknight.svg";
import whitequeen from "../../../images/chesspieces/whitequeen.svg";


export function promotionDetector(state) {
    const position = state.position;

    const promotionCallback = (square,index) => (index < 8 && square.type==="whitePawn") || (index > 55 && square.type==="blackPawn");

    return position.some(promotionCallback);
}


export function promotionLocator(state){
    const position = state.position;
    const promotionCallback = (square,index) => (index < 8 && square.type==="whitePawn") || (index > 55 && square.type==="blackPawn");
    if (promotionDetector(state)) {
        return position.findIndex(promotionCallback);
    }
}

export class Promoter extends React.Component {
    renderPromotionSquare(obj){
        return (
            <Square
                shade = "neutralshade"
                value = {obj.img}
                onClick = {() => {}}
            />
        )
    }
    
    promotionList(color){
        return [
            {type: "queen",
            color: color,
            id: "promoted",
            img: color === "white" ? whitequeen : blackqueen
            },
            {type: "knight",
            color: color,
            id: "promoted",
            img: color === "white" ? whiteknight : blackknight
            },
            {type: "rook",
            color: color,
            id: "promoted",
            img: color === "white" ? whiterook : blackrook
            },
            {type: "bishop",
            color: color,
            id: "promoted",
            img: color === "white" ? whitebishop : blackbishop
            }]
    }

    render() {
        const flexDirection ={
            "flex-direction": 'column-reverse',
            top: "-12vh",
        };
        return (
            <div className="promoter" id={this.props.promotionDisplayed} 
                style={this.props.promotionColor ==="white" ? flexDirection: null}>
                {
                this.promotionList(this.props.promotionColor)
                .map(piece => this.renderPromotionSquare(piece))
                }
            </div>
        )
    }
}

/*
game will render a div containing Promoter with css-id that hides promoter
each move, the game checks for a promotion
if detected, game will change the css-id of Promoter to something that shows the promoter
Promoter will need onClick functionality
*/

/*
Promoter actually needs to be render in the correct squares in board
then with position: absolute, we can make it display correctly
*/