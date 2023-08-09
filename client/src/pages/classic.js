import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import cardBack from "../png/cardBack.png";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import socket from "../socket";
import GameResult from "../components/GameResult";




//function help drag the card
const DraggableCard = ({ cardRef, onDrop }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { cardRef },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className="card">
      {cardRef ? (
        <img src={require(`./../png/${cardRef}`)} alt={cardRef} />
      ) : null}
    </div>
  );
};

//function help drop the card
const DroppableArea = ({ onDrop, cardRef, isValidDrop }) => {
  const [, drop] = useDrop({
    accept: "CARD",
    drop: (item) => onDrop(item.cardRef),
    canDrop: (item, monitor) => {
      return isValidDrop(item.cardRef, cardRef); // Pass the current card of the DroppableArea to the validation function
    },
  });

  return (
    <div ref={drop} className="card">
      {cardRef ? (
        <img src={require(`./../png/${cardRef}`)} alt={cardRef} />
      ) : null}
    </div>
  );
};


const Classic = ({ numPlayer, room }) => {
  const [cards, setCards] = useState([]);
  const [opponentCard, setOponentCard] = useState([]); 
  const [cardIndex, setCardIndex] = useState(5);
  const [pileIndex, setPileIndex] = useState(1);
  const [leftPile, setLeftPile] = useState(room.leftPile);
  const [rightPile, setRightPile] = useState(room.rightPile);
  const [leftCard, setLeftCard] = useState(room.leftPile[0].reference);
  const [rightCard, setRightCard] = useState(room.rightPile[0].reference);
  const [card1, setFirstCard] = useState("");
  const [card2, setSecondCard] = useState("");
  const [card3, setThirdCard] = useState("");
  const [card4, setFourthCard] = useState("");
  const [card5, setFifthCard] = useState("");
  const [isGameOver, setGameOver] = useState(false);
  const [isWinner, setWinner] = useState(false);

  //set all card ready
  useEffect(() => {
    let selectedCards = numPlayer === 1 ? room.user1Cards : room.user2Cards;
    setCards(selectedCards);
    setFirstCard(selectedCards[0].reference);
    setSecondCard(selectedCards[1].reference);
    setThirdCard(selectedCards[2].reference);
    setFourthCard(selectedCards[3].reference);
    setFifthCard(selectedCards[4].reference);
    const emitEvent = () => {
      let opponentCards = [selectedCards[0].reference, selectedCards[1].reference, selectedCards[2].reference, selectedCards[3].reference, selectedCards[4].reference];
      socket.emit("classic_play", { id: room._id, leftCard, rightCard, pileIndex: pileIndex, opponentCard: opponentCards, gameOver: isGameOver });
    };

    emitEvent();

  }, []);

  //compare player vs current opponent array
  const checkOpponentArray = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] === arr2[i]) return true;
    }
    return false;
  };
  //----------------receive data from websocket--------------
  useEffect(() => {
    const moveHandler = (data) => {
      if (data.leftCard && data.rightCard) {
        setLeftCard(data.leftCard);
        setRightCard(data.rightCard);
        
        // Check if the arrays are not equal and then set opponent cards
        if (!checkOpponentArray(data.opponentCard, [card1, card2, card3, card4, card5])) {
          console.log("opponent card is set")
          setOponentCard(data.opponentCard);
        }
        
        setPileIndex(data.pileIndex);
        setGameOver(data.gameOver);
      }
    };
    socket.on("classic_play", moveHandler);

    return () => {
      socket.off("classic_play", moveHandler);
    };
  }, [socket, leftCard, rightCard]);
//-----------------------------------------------

//functions assist to check if a card is valid to drop ------------------------------
  const getCardRank = (cardRef) => {
    const rank = cardRef.split("_")[0];
    switch (rank) {
      case "king":
        return 13;
      case "queen":
        return 12;
      case "jack":
        return 11;
      case "ace":
        return 1;
      default:
        return parseInt(rank, 10); // For numerical values
    }
  };


  const isValidDrop = (droppedCardRef, currentCardRef) => {
    const droppedRank = getCardRank(droppedCardRef);
    const currentRank = getCardRank(currentCardRef);

    const difference = Math.abs(droppedRank - currentRank);

    return difference === 1; // Return true if ranks differ by 1, else false
  };

  const removeDroppedCard = (droppedCardRef) => {
    let cardList = [card1, card2, card3, card4, card5]
    if (droppedCardRef === card1) {
      setFirstCard("");
      cardList[0] = "";
    } else if (droppedCardRef === card2) {
      setSecondCard("");
      cardList[1] = "";
    } else if (droppedCardRef === card3) {
      setThirdCard("");
      cardList[2] = "";
    } else if (droppedCardRef === card4) {
      setFourthCard("");
      cardList[3] = "";
    } else if (droppedCardRef === card5) {
      setFifthCard("");
      cardList[4] = "";
    }
    return cardList
  };
//----------------------------------------------------------------

//-------------------------check game over---------------------------------------
const checkWinner = () => {
  let cardList = [card1, card2, card3, card4, card5];
  console.log("check winner cardList: ")
  console.log(cardList)
  // Check if all cards are empty and cardIndex is 20
  if(cardList.every((card) => card === "") && cardIndex === 20) {
      setWinner(true);
      setGameOver(true);
      return true;
  }
  
  return false;
}

  //-----------------------------------------------------------------

  //--------------------function for left and right card drop ------------------------------------
  const handleLeftCardDrop = (droppedCardRef) => {
    // Logic for when a card is dropped on the left card
    
    setLeftCard(droppedCardRef);
    

    const emitEvent = () => {
      socket.emit("classic_play", { id: room._id, leftCard: droppedCardRef, rightCard: rightCard, pileIndex: pileIndex, opponentCard: removeDroppedCard(droppedCardRef), gameOver: checkWinner() });
    };

    emitEvent();
  };

  const handleRightCardDrop = (droppedCardRef) => {
    // Logic for when a card is dropped on the right card
    setRightCard(droppedCardRef);
    checkWinner()
    const emitEvent = () => {
      socket.emit("classic_play", { id: room._id, leftCard: leftCard, rightCard: droppedCardRef, pileIndex: pileIndex, opponentCard: removeDroppedCard(droppedCardRef), gameOver: checkWinner() });
    };

    emitEvent();
  };
  //----------------------------------------------------------

  //-------------------------handle card click ---------------------------------

  const handleCardClick = () => {
    let tempCardIndex = cardIndex;

    if (tempCardIndex === 20) {
        return; 
    }

    const cardSetters = [setFirstCard, setSecondCard, setThirdCard, setFourthCard, setFifthCard];
    const cardValues = [card1, card2, card3, card4, card5];
    let opponentCards = [card1, card2, card3, card4, card5];

    for (let i = 0; i < cardSetters.length; i++) {
        if (cardValues[i] === "" && tempCardIndex !== 20) {
            console.log(`card ${i + 1} empty`);
            opponentCards[i] = cards[tempCardIndex].reference
            cardSetters[i](cards[tempCardIndex].reference);
            tempCardIndex++;
        }
    }

    setCardIndex(tempCardIndex);

    const emitEvent = () => {
      socket.emit("classic_play", { id: room._id, leftCard: leftCard, rightCard: rightCard, pileIndex: pileIndex, opponentCard: opponentCards, gameOver: isGameOver });
    };

    emitEvent();
  };

  //---------------------------------------------------------------------------------

  //---------------------------these function assist handle pile click----------
  const checkValidity = (card, left, right) => {
    return !(isValidDrop(card, left) || isValidDrop(card, right));
  };

  const areAllCardsInvalid = (cardsList, left, right) => {
    
    return cardsList.every((card) => checkValidity(card, left, right));
  };
 //---------------------------------------------------------------------------


 //-----------------function help handling pile click----------------------------
  const handlePileClick = () => {
    if(pileIndex === 5) return // I will continue to reshuffle the card
    let tempIndex = pileIndex;
    if ([card1, card2, card3, card4, card5].some((card) => card === "")) return;
    if(opponentCard.some((card) => card === "")) return;

    const cardsList = [card1, card2, card3, card4, card5];
    console.log("opponent card: ")
    console.log(opponentCard)
    console.log("player Card: ")
    console.log(cardsList)
    if (areAllCardsInvalid(cardsList, leftCard, rightCard) && areAllCardsInvalid(opponentCard, leftCard, rightCard)) {
      console.log("all cards are invalid")
      setLeftCard(leftPile[tempIndex].reference)
      setRightCard(rightPile[tempIndex].reference)
      setPileIndex(tempIndex + 1);
      const emitEvent = () => {
        let opponentCards = [card1, card2, card3, card4, card5];
        socket.emit("classic_play", { id: room._id, leftCard: leftPile[tempIndex+1].reference, rightCard: rightPile[tempIndex+1].reference, pileIndex: tempIndex + 1, opponentCard: opponentCards, gameOver: isGameOver });
      };
  
      emitEvent();
    }
  };
  //-----------------------------------------------------------------------------------

  return (
    <DndProvider backend={HTML5Backend}>
      <GameResult gameOver={isGameOver} isWinner={isWinner}/>
      <Container className="container-classic">
        <div className="cards">
          <Row xs={6} sm={6} md={6} lg={6}>
            <Col>
              <div className="card">
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
              </div>
            </Col>
            <Col>
              <div className="card">
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
              </div>
            </Col>
            <Col>
              <div className="card">
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
              </div>
            </Col>
            <Col>
              <div className="card">
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
              </div>
            </Col>
            <Col>
              <div className="card">
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
              </div>
            </Col>
            <Col>
              <div className="card">
                <img src={cardBack} alt="back of card" />
                <div className="textOverlay">{cards.length}</div>
              </div>
            </Col>
          </Row>
        </div>
        <div className="cards">
          <Row xs={6} sm={6} md={6} lg={6} className="row">
            <Col>
              <div className="card" onClick={handlePileClick}>
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
                <div className="textOverlay">{leftPile.length - pileIndex}</div>
              </div>
            </Col>
            <Col>
              <DroppableArea
                onDrop={handleLeftCardDrop}
                cardRef={leftCard}
                isValidDrop={isValidDrop}
              />
            </Col>
            <Col>
              <DroppableArea
                onDrop={handleRightCardDrop}
                cardRef={rightCard}
                isValidDrop={isValidDrop}
              />
            </Col>
            <Col>
              <div className="card" onClick={handlePileClick}>
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
                <div className="textOverlay">{rightPile.length - pileIndex}</div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="cards">
          <Row xs={6}>
            <Col>
              <DraggableCard cardRef={card1} />
            </Col>
            <Col>
              <DraggableCard cardRef={card2} />
            </Col>
            <Col>
              <DraggableCard cardRef={card3} />
            </Col>
            <Col>
              <DraggableCard cardRef={card4} />
            </Col>
            <Col>
              <DraggableCard cardRef={card5} />
            </Col>
            <Col>
              <div className="card" onClick={handleCardClick}>
                <img src={require(`./../png/cardBack.png`)} alt={"cardBack"} />
                <div className="textOverlay">
                  {cards.length - cardIndex}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </DndProvider>
  );
};

export default Classic;
