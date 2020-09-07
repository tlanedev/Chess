/*jslint es6 */

import React from 'react';
import './game.css';
import { firstPosition } from './pieces/pieces.js';
import { movesLogic } from './pieces/pieceslogic.js'
import { checkFilter, checkmateDetector } from './pieces/checklogic.js'
import { TurnIndicator } from './turnindicator/turnindicator.js';
import { Board } from './board/board.js';
import { moveHelper, checkHelper, stateHelper} from './gamehelpers.js'
import { History } from './history/history.js';
import socketIsListening from '../../socketIsListening.js'

export class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            constellation: firstPosition,
            history: [],
            selected: null,
            whiteIsNext: true,
            promotionStatus: false,
            promotionLocation: null,
        };

        socketIsListening()
    }

    

    possibleMoves(selected){ //returns array of moves
        const constellation = this.state.constellation;
        const whiteIsNext = this.state.whiteIsNext;

        if (selected !==null){ //conditional to avoid constellation.position[null].type which throws error
            const currentPiece = constellation.position[selected].type;

            if (constellation.position[selected].type){ //nonempty square selected
                return checkFilter(movesLogic[currentPiece](selected,constellation), selected, constellation, whiteIsNext)
            } else { //empty square selected
                return []
            }

        } else { //selected===null
            return []
        }
    }

    squareIsPossibleMove(square) {  //returns boolean describing if a given square is a possible move from selected
        const selected = this.state.selected;
        return Boolean(
            this.possibleMoves(selected)
            .filter(element => element === square)
            .length);
    }

    shade(square){//adds a css id to each square that decides shade
        const constellation = this.state.constellation;
        let squareIsPossibleMove = this.squareIsPossibleMove(square)

        if (square===this.state.selected  && constellation.position[square].type){
            //if square is selected and square is not empty
            return "selected"
        } else if (squareIsPossibleMove) {
            return "possibleMove"
        } else {
            //standard shading for chess board describing using modulo conditionals
            return (square%2===0 && square%16 <=7) || (square%2!==0 && square%16 >7) ? "light" : "dark";
        }
    }

    promotionHandler(selection,nextSquare){
        //during promotion nextSquare is actually a piece e.g. { type: "queen", color: "white", id: "promoted", img: ...}
        const oldHistory = JSON.parse(JSON.stringify(this.state.history));
        const whiteIsNext = this.state.whiteIsNext;
        const promotionLocation = this.state.promotionLocation;

        const currentConstellation = JSON.parse(JSON.stringify(this.state.constellation)); //copy
        const currentPosition = JSON.parse(JSON.stringify(currentConstellation.position)); //copy
        const pawnType = currentPosition[selection].type;

        //redundant code but should make this bit more readable
        let nextConstellation=currentConstellation;         //this is just a pointer to currentConstellation which we will mutate
        let nextPosition=currentConstellation.position;     //this is just a pointer to currentConstellation.position which we will mutate

        const nextSquareIsOccupied = Boolean(currentPosition[promotionLocation].type);
        if (nextSquareIsOccupied){
            whiteIsNext
            ? nextConstellation.takenBlackPieces.push([currentPosition[nextSquare],oldHistory.length])
            : nextConstellation.takenWhitePieces.push([currentPosition[nextSquare],oldHistory.length]);
        }
        //moving pieces
        nextPosition[selection] = {type: null};
        nextPosition[promotionLocation] = nextSquare;


        checkHelper(nextConstellation, whiteIsNext)

        this.setState({
            history: oldHistory.concat([[pawnType,nextSquare.type,selection,promotionLocation]]),
            constellation: nextConstellation,
            selected: null,
            whiteIsNext: !whiteIsNext,
            promotionLocation: null,
            promotionStatus: false
        });

    }

    moveHandler(selection, nextSquare) {
        const oldHistory = JSON.parse(JSON.stringify(this.state.history));
        const whiteIsNext = this.state.whiteIsNext;
        const promotionLocation = this.state.promotionLocation;

        //const freshHistory = JSON.parse(JSON.stringify(history)); //need multiple history because js keeps live references to subobjects

        const currentConstellation = JSON.parse(JSON.stringify(this.state.constellation)); //copy
        const currentPosition = JSON.parse(JSON.stringify(currentConstellation.position)); //copy

        //redundant code but should make this bit more readable
        let nextConstellation=currentConstellation;         //this is just a pointer to currentConstellation which we will mutate
        let nextPosition=currentConstellation.position;     //this is just a pointer to currentConstellation.position which we will mutate

        if (promotionLocation !== null){
            this.promotionHandler(selection,nextSquare)
        } else {
            const nextSquareIsOccupied = Boolean(currentPosition[nextSquare].type);
            if (nextSquareIsOccupied){
                whiteIsNext
                ? nextConstellation.takenBlackPieces.push([currentPosition[nextSquare],oldHistory.length])
                : nextConstellation.takenWhitePieces.push([currentPosition[nextSquare],oldHistory.length]);
            }

            nextConstellation.enPassant={};

            const promotionDetection =
            (nextPosition[selection].type==="whitePawn" && nextSquare < 8)
            || (nextPosition[selection].type==="blackPawn" && nextSquare > 55);

            if (!promotionDetection) {
                moveHelper[currentPosition[selection].type](selection, nextSquare, nextConstellation);

                checkHelper(nextConstellation, whiteIsNext);

                stateHelper[nextPosition[nextSquare].type](selection,nextSquare,nextConstellation);

                this.setState({
                    history: oldHistory.concat([[nextPosition[nextSquare].type,selection,nextSquare]]),
                    constellation: nextConstellation,
                    selected: null,
                    whiteIsNext: !whiteIsNext
                });
            } else {
                this.setState({
                    promotionStatus: true,
                    promotionLocation: nextSquare,
                });

            }
        }

    }


    squareIsPromotion = (square) => square.id==="promoted";

    async handleClick(square) {
        const currentConstellation = JSON.parse(JSON.stringify(this.state.constellation));
        const currentPosition = currentConstellation.position;
        const selected = this.state.selected;
        const whiteIsNext = this.state.whiteIsNext;
        const promotionLocation = this.state.promotionLocation
        //nothing selected, selecting piece of correct color
        if (selected===null && currentPosition[square].type !== null && (currentPosition[square].color==="white")===whiteIsNext) {
            this.setState({
                selected: square
            });
        }
        //something is selected
        if (selected !== null) {
            if (selected !== square){ //clicking on non-selected square
                if (this.squareIsPromotion(square)){
                    await this.moveHandler(selected,square);
                    if (checkmateDetector(this.state.constellation,this.state.whiteIsNext)) {alert("Mate!")}
                } else if (this.squareIsPossibleMove(square) && square !== promotionLocation) {//move will be executed
                    await this.moveHandler(selected,square);
                    if (checkmateDetector(this.state.constellation,this.state.whiteIsNext)) {
                        alert("Mate!")}
                    if (true) {
                        console.log("move happened")
                    }
                } else { //clicking on a not possible move square
                    if (this.state.promotionStatus) {
                        this.setState({
                            promotionStatus: false,
                            promotionLocation: null,
                        });
                    }
                    if (currentPosition[square].type !== null && (currentPosition[square].color==="white")===whiteIsNext) { //selecting different piece
                        this.setState({
                            selected: square
                        });
                    } else { //clicking neutral square will clear selected
                        this.setState({
                            selected: null
                        });
                    }
                }
            }
        }
    }

    render() {
        const history = this.state.history;
        const currentConstellation = this.state.constellation;
        const currentPosition = currentConstellation.position;
        const whiteIsNext = this.state.whiteIsNext;
        const promotionLocation = this.state.promotionLocation;
        //const checkmate = checkmateDetector(current,whiteIsNext); //need to work this in somehow
        //need to add draw

        return (
            <div className="game-container">
                <div className="board-container">
                    <div className="player-info">
                        <div className= "takenPieces"> takenWhitePieces </div>
                        <TurnIndicator
                            turn = {!whiteIsNext ? "" : "yourTurn"}
                            value = "Black's Turn"
                            colorOfIndicator = "black-turn-indicator"
                        /> 
                    </div>
                    <Board 
                        position= { currentPosition }
                        onClick = {square => {
                            this.handleClick(square);
                            }}
                        shade = { square => this.shade(square) }
                        whiteIsNext = { whiteIsNext }
                        currentState={currentConstellation}
                        promotionLocation={ promotionLocation }
                    />
                    <div className="player-info">
                        <div className= "takenPieces"> takenBlackPieces </div>
                        <TurnIndicator
                            turn={!whiteIsNext ? "yourTurn" : ""}
                            value="White's Turn"
                            colorOfIndicator="white-turn-indicator"
                        />
                    </div>
                </div>
                <History
                    completeHistory = { history }
                />
            </div>
        )
    }
}