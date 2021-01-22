import React from "react";
import { Cell } from "../Cell/Cell.js";
import { connect } from "react-redux";
import { setRemainingFlags,setRemainingNonBombCells } from "../../../../store/MineSweeper/actions";
import { setNewGame} from "../../../../store/SetUp/actions";
import { setGameStatus} from "../../../../store/MineSweeper/actions";

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      boardCells: [],
      shiftIsPressed: false,
      flaggedMines: 0,
      flaggedCount: 0,
    };

    this.mineClicked = this.mineClicked.bind(this);
    this.flagClicked = this.flagClicked.bind(this);
    this.revealCells = this.revealCells.bind(this);
    this.runOnNeighbors = this.runOnNeighbors.bind(this);
  }

  componentWillMount() {
    this.buildBoard();
    this.setState({
      containerHeight: `${this.getContainerHeight()}`,
      containerWidth: `${this.getContainerWidth()}`,
    });
  }

  componentDidMount() {
    window.addEventListener("keyup", this.keyUnpressed.bind(this));
    window.addEventListener("keydown", this.keyPressed.bind(this));
  }

  keyPressed(key) {
    if (key.code === "ShiftLeft") {
      this.setState({ shiftIsPressed: true });
    }
  }

  keyUnpressed(key) {
    if (key.code === "ShiftLeft") {
      this.setState({ shiftIsPressed: false });
    }
  }

  getContainerHeight() {
    try {
      return window.innerHeight - 150;
    } catch (e) {
      return 100;
    }
  }

  getContainerWidth() {
    try {
      return window.innerWidth - 150;
    } catch (e) {
      return 100;
    }
  }

  buildBoard() {
    let boardCells = [],
      minesArray = [];
    boardCells = this.createBoard();
    minesArray = this.shuffleMines(boardCells);
    this.fillMinesInBoardAndAddValueToNeighbors(boardCells, minesArray);
    this.setState({ boardCells, flaggedMines: 0 });
    this.props.setRemainingFlags(this.props.mines);
    this.props.setRemainingNonBombCells((this.props.width*this.props.height) - this.props.mines)
    this.props.setNewGame(false);
  }

  createBoard() {
    let boardCells = [];
    for (let i = 0; i < this.props.height; i++) {
      boardCells[i] = [];
      for (let j = 0; j < this.props.height; j++) {
        boardCells[i][j] = {
          mine: false,
          flag: false,
          value: 0,
          reveald: false,
          location: { width: i, height: j },
        };
      }
    }
    return boardCells;
  }

  shuffleMines(boardCells) {
    let minesArray = [],
      randomArray = [];
    for (let i = 0; i < this.props.width; i++) {
      for (let j = 0; j < this.props.height; j++) {
        randomArray.push({ width: i, height: j });
      }
    }
    randomArray = this.randomMines(randomArray);
    for (let i = 0; i < this.props.mines; i++) {
      boardCells[randomArray[i].width][randomArray[i].height].mine = true;
      minesArray.push({
        width: randomArray[i].width,
        height: randomArray[i].height,
      });
    }
    return minesArray;
  }

  randomMines(minesArrayForShuffle) {
    for (let i = minesArrayForShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [minesArrayForShuffle[i], minesArrayForShuffle[j]] = [
        minesArrayForShuffle[j],
        minesArrayForShuffle[i],
      ];
    }
    return minesArrayForShuffle;
  }

  fillMinesInBoardAndAddValueToNeighbors(boardCells, minesArray) {
    minesArray.forEach((mine) => {
      this.runOnNeighbors(mine.width, mine.height, boardCells, true);
    });
  }

  flagClicked(cellData) {
    if (this.props.remainingFlags === 0 && !cellData.flag) {
      alert("You dont have any more flags!");
    } else {
      const isCellFlagged = this.updateBoardWithFlag(cellData);
      let flaggedCells = isCellFlagged
        ? this.props.remainingFlags - 1
        : this.props.remainingFlags + 1;

      this.props.setRemainingFlags(flaggedCells);
    }
  }

  updateBoardWithFlag(cellData) {
    const isFlagged = !this.state.boardCells[cellData.location.width][
      cellData.location.height
    ].flag;
    let updatedCellBoard = this.state.boardCells.map((arr) => arr.slice());
    updatedCellBoard[cellData.location.width][
      cellData.location.height
    ].flag = isFlagged;
    this.setState({ boardCells: updatedCellBoard });
    return isFlagged;
  }
  updateBoardWithMine(cellData) {
    const isFlagged = !this.state.boardCells[cellData.location.width][
      cellData.location.height
    ].flag;
    let updatedCellBoard = this.state.boardCells.map((arr) => arr.slice());
    updatedCellBoard[cellData.location.width][
      cellData.location.height
    ].flag = isFlagged;
    this.setState({ boardCells: updatedCellBoard });
    return isFlagged;
  }

  componentDidUpdate() {
    if (this.props.newGame) {
      this.buildBoard();
    }
  }

  async revealCells(clickedCell) {
    var newBoardCells = this.state.boardCells.map((arr) => arr.slice());

    if (clickedCell == undefined) {

      for (var i = 0; i < newBoardCells.length ; i++) {
        for (var j = 0; j < newBoardCells[i].length; j++) {
          newBoardCells[i][j].reveald = true;
        }
      }
      this.setState({ boardCells: newBoardCells });
      return;
    }
    if (clickedCell.value > 0) {
      clickedCell.reveald = true;
      newBoardCells[clickedCell.location.width][clickedCell.location.height];
      await this.props.setRemainingNonBombCells(this.props.remainingNonBombCells - 1);    
      
      if(this.props.remainingNonBombCells == -1){
        this.handleWin();
      }
    }
     else {
      this.runOnNeighbors(
        clickedCell.location.width,
        clickedCell.location.height,
        newBoardCells,
        false
      );
    }
    this.setState({ boardCells: newBoardCells });
  }

   async runOnNeighbors(cellWidth, cellHeight, newBoardCells, isFillMinesFlow) {
    let neighborsToCheck = [];
    neighborsToCheck.push(newBoardCells[cellWidth][cellHeight]);

    while (neighborsToCheck.length != 0) {
      let currentCell = neighborsToCheck.pop();
      cellWidth = currentCell.location.width;
      cellHeight = currentCell.location.height;

      for (var i = cellWidth - 1; i <= cellWidth + 1; i++) {
        for (var j = cellHeight - 1; j <= cellHeight + 1; j++) {
          var neighbor = newBoardCells[i] && newBoardCells[i][j];
          if (isFillMinesFlow && neighbor) {
            neighbor.value++;
          } else if (
            neighbor &&
            !neighbor.reveald &&
            !neighbor.mine &&
            !neighbor.flag
          ) {
            neighbor.reveald = true;
            await this.props.setRemainingNonBombCells(this.props.remainingNonBombCells - 1)
            if(this.props.remainingNonBombCells == -1){
              this.handleWin();
            }
            if (neighbor.value === 0) {
              neighborsToCheck.push(neighbor);
            }
          }
        }
      }
    }
  }

  mineClicked(cellData) {
   
    cellData.isGameOverCell = true;
    
    var cellFailure = document.querySelectorAll('.board tr')[parseInt(cellData.location.width)].querySelectorAll('td')[cellData.location.height]

    setTimeout(() => {
      alert("You clicked on a Mine! :(");  
    }, 100);
    this.revealCells();
    this.props.setGameStatus("😫");

    cellFailure.style.backgroundColor='Orange';
    
  }
  handleWin() {
    this.props.setRemainingFlags(this.props.mines);
    
    var newBoardCells = this.state.boardCells.map((arr) => arr.slice());

      for (var i = 0; i < newBoardCells.length ; i++) {
        for (var j = 0; j < newBoardCells[i].length; j++) {
          if(newBoardCells[i][j].mine){
            newBoardCells[i][j].flag = true;
          }
        }
      }
      setTimeout(() => {
        alert("You win!");    
      }, 100);
    
  }

  render() {
    return (
      <div id="board-root">
        <table
          className="board"
          style={{
            overflowX: "auto",
            borderSpacing: "1px",
          }}
        >
          <tbody>
            {this.state.boardCells.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <Cell
                    data={cell}
                    key={cellIndex}
                    boardMeasures={{
                      containerHeight: this.state.containerHeight,
                      containerWidth: this.state.containerWidth,
                      numOfHeightCells: this.props.boardHeight,
                      numOfWidthCells: this.props.boardWidth,
                    }}
                    isShiftPressed={this.state.shiftIsPressed}
                    flagClicked={this.flagClicked}
                    revealCells={this.revealCells}
                    mineClicked={this.mineClicked}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    height: state.Setup.height,
    width: state.Setup.width,
    mines: state.Setup.mines,
    remainingFlags: state.MineSweeper.remainingFlags,
    remainingNonBombCells: state.MineSweeper.remainingNonBombCells,
  };
};

export default connect(mapStateToProps, { setRemainingFlags,setRemainingNonBombCells, setNewGame,setGameStatus })(Board);