"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const FLIP_DURATION = 0.8;
const STAGGER_DURATION = 0.1;

const processWordList = (content: string): string[] => {
  return content
    .split("\n")
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length === WORD_LENGTH && /^[A-Z]+$/.test(word));
};

type TileStatus = "correct" | "present" | "absent" | "empty" | "typing";

interface TileProps {
  letter?: string;
  status: TileStatus;
  animatePop?: boolean;
  animateFlip?: boolean;
  delay?: number;
}

interface RowProps {
  guess?: string;
  evaluation?: TileStatus[];
  isCurrent?: boolean;
  isShaking?: boolean;
}

interface KeyboardKeyProps {
  letter: string;
  status?: TileStatus;
  onClick: (letter: string) => void;
}

const Tile: React.FC<TileProps> = ({
  letter,
  status,
  animatePop,
  animateFlip,
  delay = 0,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showContent, setShowContent] = useState(true);

  const variants = {
    initial: { rotateY: 0, scale: 1 },
    flip: {
      rotateY: 180,
      transition: {
        duration: FLIP_DURATION,
        delay: delay,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    typing: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.15 },
    },
  };

  const getBgAndBorder = (s: TileStatus): string => {
    switch (s) {
      case "correct":
        return "bg-green-500 border-green-500";
      case "present":
        return "bg-yellow-500 border-yellow-500";
      case "absent":
        return "bg-gray-600 border-gray-600";
      case "typing":
        return "bg-gray-800 border-gray-500";
      case "empty":
      default:
        return "bg-gray-800 border-gray-700";
    }
  };

  const tileStyle = getBgAndBorder(status);
  const showLetter = status !== "empty";

  useEffect(() => {
    if (status === "typing" || status === "empty") {
      setIsFlipped(false);
      setShowContent(true);
    }
  }, [status]);

  return (
    <motion.div
      className={`w-14 h-14 sm:w-16 sm:h-16 border-2 rounded-md flex items-center justify-center text-3xl sm:text-4xl font-bold uppercase text-white ${tileStyle}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
        willChange: "transform",
      }}
      variants={variants}
      initial="initial"
      animate={[animatePop ? "typing" : "", animateFlip ? "flip" : "initial"]}
      // --- Use onAnimationComplete ---
      onAnimationStart={() => {
        if (animateFlip) {
          // Optionally hide content slightly before flip starts if needed
          setShowContent(false);
        }
      }}
      onAnimationComplete={() => {
        if (animateFlip) {
          setIsFlipped(true);
          setShowContent(true);
        }
      }}
    >
      <span
        style={{
          display: "inline-block",
          // Apply rotation directly based on state, not animation
          // This ensures it's correct after the parent finishes flipping
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          backfaceVisibility: "hidden",
          opacity: showContent ? 1 : 0,
        }}
      >
        {showLetter ? letter : ""}
      </span>
    </motion.div>
  );
};

const Row: React.FC<RowProps> = ({
  guess = "",
  evaluation = [],
  isCurrent = false,
  isShaking = false,
}) => {
  const variants = {
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } },
    idle: { x: 0 },
  };
  return (
    <motion.div
      className="flex gap-1.5 mb-1.5"
      variants={variants}
      animate={isShaking ? "shake" : "idle"}
    >
      {Array.from({ length: WORD_LENGTH }).map((_, i) => {
        const status = evaluation[i]
          ? evaluation[i]
          : i < guess.length
          ? "typing"
          : "empty";
        return (
          <Tile
            key={i}
            letter={guess[i]}
            status={status}
            animatePop={
              isCurrent &&
              i === guess.length - 1 &&
              guess.length > 0 &&
              !evaluation.length
            }
            animateFlip={evaluation.length > 0}
            delay={evaluation.length > 0 ? i * STAGGER_DURATION : 0}
          />
        );
      })}
    </motion.div>
  );
};

const Grid: React.FC<{
  guesses: string[];
  evaluations: TileStatus[][];
  currentAttempt: number;
  currentGuess: string;
  shakeRowIndex: number | null;
}> = ({
  guesses,
  evaluations,
  currentAttempt,
  currentGuess,
  shakeRowIndex,
}) => {
  return (
    <div className="flex flex-col items-center mb-6">
      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
        <Row
          key={i}
          guess={i === currentAttempt ? currentGuess : guesses[i]}
          evaluation={evaluations[i]}
          isCurrent={i === currentAttempt}
          isShaking={shakeRowIndex === i}
        />
      ))}
    </div>
  );
};

const KeyboardKey: React.FC<KeyboardKeyProps> = ({
  letter,
  status,
  onClick,
}) => {
  const getBgColor = () => {
    switch (status) {
      case "correct":
        return "bg-green-600 hover:bg-green-500";
      case "present":
        return "bg-yellow-600 hover:bg-yellow-500";
      case "absent":
        return "bg-gray-700 hover:bg-gray-600";
      default:
        return "bg-gray-500 hover:bg-gray-400";
    }
  };
  const widthClass = letter.length > 1 ? "px-4 w-auto" : "w-9 sm:w-11";
  return (
    <motion.button
      onClick={() => onClick(letter)}
      className={`h-14 ${widthClass} rounded-md flex items-center justify-center text-sm sm:text-base font-semibold uppercase text-white transition-colors duration-150 ${getBgColor()}`}
      whileTap={{ scale: 0.95 }}
    >
      {letter === "Backspace" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.21.47-.364.74-.466a.75.75 0 1 1 .466 1.416a.375.375 0 0 0-.18.18l-4.12 4.121a.375.375 0 0 0 0 .53l6.375 6.375a.375.375 0 0 0 .53 0l6.375-6.375a.375.375 0 0 0 0-.53l-4.12-4.121a.375.375 0 0 0-.18-.18.75.75 0 1 1 .466-1.416c.27.102.53.256.74.466l4.12 4.12a1.125 1.125 0 0 1 0 1.59l-6.375 6.375a1.125 1.125 0 0 1-1.59 0Z"
          />
        </svg>
      ) : (
        letter
      )}
    </motion.button>
  );
};

const Keyboard: React.FC<{
  keyStatuses: { [key: string]: TileStatus };
  onKeyPress: (key: string) => void;
}> = ({ keyStatuses, onKeyPress }) => {
  const rows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["Enter", ..."ZXCVBNM".split(""), "Backspace"],
  ];
  return (
    <div className="flex flex-col items-center gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1.5">
          {row.map((key) => (
            <KeyboardKey
              key={key}
              letter={key}
              status={keyStatuses[key.toUpperCase()]}
              onClick={onKeyPress}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const WordleGame: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [answerList, setAnswerList] = useState<string[]>([]);
  const [validGuessSet, setValidGuessSet] = useState<Set<string>>(new Set());

  const [targetWord, setTargetWord] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>(
    Array(MAX_ATTEMPTS).fill("")
  );
  const [evaluations, setEvaluations] = useState<TileStatus[][]>(
    Array(MAX_ATTEMPTS).fill([])
  );
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [keyStatuses, setKeyStatuses] = useState<{ [key: string]: TileStatus }>(
    {}
  );
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "won" | "lost"
  >("loading");
  const [message, setMessage] = useState<string>("");
  const [shakeRowIndex, setShakeRowIndex] = useState<number | null>(null);

  const initializeGame = useCallback((answers: string[]) => {
    if (answers.length === 0) {
      console.error("Answer list is empty, cannot start game.");
      setMessage("Error loading word list.");
      setIsLoading(false);
      setGameState("lost");
      return;
    }
    const newTargetWord = answers[Math.floor(Math.random() * answers.length)];
    setTargetWord(newTargetWord);
    setGuesses(Array(MAX_ATTEMPTS).fill(""));
    setEvaluations(Array(MAX_ATTEMPTS).fill([]));
    setCurrentAttempt(0);
    setCurrentGuess("");
    setKeyStatuses({});
    setGameState("playing");
    setMessage("");
    setShakeRowIndex(null);
    setIsLoading(false);
    console.log("Target word (for debugging):", newTargetWord);
  }, []);

  useEffect(() => {
    const loadWordLists = async () => {
      setIsLoading(true);
      setGameState("loading");
      try {
        console.log("Fetching word lists...");
        const [answersResponse, validWordsResponse] = await Promise.all([
          fetch("/answers.txt"), // Assumes file is in /public/answers.txt
          fetch("/valid-words.txt"), // Assumes file is in /public/valid-words.txt
        ]);

        if (!answersResponse.ok)
          throw new Error(
            `Failed to fetch answers.txt: ${answersResponse.statusText}`
          );
        if (!validWordsResponse.ok)
          throw new Error(
            `Failed to fetch valid-words.txt: ${validWordsResponse.statusText}`
          );

        const answersText = await answersResponse.text();
        const validWordsText = await validWordsResponse.text();

        console.log("Processing word lists...");
        const answers = processWordList(answersText);
        const validWords = processWordList(validWordsText);

        if (answers.length === 0)
          throw new Error("Answers list is empty after processing.");

        setAnswerList(answers);
        setValidGuessSet(new Set([...answers, ...validWords]));

        console.log(
          `Processed ${answers.length} answers and ${
            validWords.length + answers.length
          } total valid words.`
        );
        initializeGame(answers);
      } catch (error) {
        console.error("Error loading or processing word lists:", error);
        setMessage(
          `Error: ${
            error instanceof Error ? error.message : "Failed to load words"
          }`
        );
        setGameState("lost");
        setIsLoading(false);
      }
    };

    loadWordLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const evaluateGuess = useCallback(
    (guess: string): TileStatus[] => {
      const guessLetters = guess.split("");
      const targetLetters = targetWord.split("");
      const evaluation: TileStatus[] = Array(WORD_LENGTH).fill("absent");
      const letterCounts: { [key: string]: number } = {};
      targetLetters.forEach((letter) => {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
      });
      guessLetters.forEach((letter, index) => {
        if (letter === targetLetters[index]) {
          evaluation[index] = "correct";
          letterCounts[letter]--;
        }
      });
      guessLetters.forEach((letter, index) => {
        if (
          evaluation[index] !== "correct" &&
          targetLetters.includes(letter) &&
          letterCounts[letter] > 0
        ) {
          evaluation[index] = "present";
          letterCounts[letter]--;
        }
      });
      return evaluation;
    },
    [targetWord]
  );

  // Handle guess submission (with validation)
  const handleSubmit = useCallback(() => {
    if (gameState !== "playing" || currentAttempt >= MAX_ATTEMPTS) return;

    if (currentGuess.length !== WORD_LENGTH) {
      setShakeRowIndex(currentAttempt);
      setMessage("Not enough letters");
      setTimeout(() => {
        setShakeRowIndex(null);
        setMessage((prev) => (prev === "Not enough letters" ? "" : prev));
      }, 600);
      return;
    }

    if (!validGuessSet.has(currentGuess)) {
      setShakeRowIndex(currentAttempt);
      setMessage("Not in word list");
      setTimeout(() => {
        setShakeRowIndex(null);
        setMessage((prev) => (prev === "Not in word list" ? "" : prev));
      }, 600);
      return;
    }

    const evaluationResult = evaluateGuess(currentGuess);
    const newGuesses = guesses.map((g, i) =>
      i === currentAttempt ? currentGuess : g
    );
    const newEvaluations = evaluations.map((e, i) =>
      i === currentAttempt ? evaluationResult : e
    );
    const newKeyStatuses = { ...keyStatuses };
    currentGuess.split("").forEach((letter, index) => {
      const currentStatus = newKeyStatuses[letter];
      const newStatus = evaluationResult[index];
      if (
        newStatus === "correct" ||
        (newStatus === "present" && currentStatus !== "correct") ||
        (newStatus === "absent" && !currentStatus)
      ) {
        newKeyStatuses[letter] = newStatus;
      } else if (!currentStatus && newStatus === "absent") {
        newKeyStatuses[letter] = "absent";
      }
    });

    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    setKeyStatuses(newKeyStatuses);

    if (currentGuess === targetWord) {
      setGameState("won");
      setTimeout(
        () => setMessage("You won!"),
        FLIP_DURATION * 1000 + WORD_LENGTH * STAGGER_DURATION * 1000
      );
    } else if (currentAttempt === MAX_ATTEMPTS - 1) {
      setGameState("lost");
      setTimeout(
        () => setMessage(`You lost! The word was: ${targetWord}`),
        FLIP_DURATION * 1000 + WORD_LENGTH * STAGGER_DURATION * 1000
      );
    } else {
      setCurrentAttempt((prev) => prev + 1);
      setCurrentGuess("");
    }
  }, [
    gameState,
    currentGuess,
    currentAttempt,
    targetWord,
    guesses,
    evaluations,
    keyStatuses,
    evaluateGuess,
    validGuessSet,
  ]);

  // Handle key presses
  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing") return;
      if (key === "Enter") {
        handleSubmit();
      } else if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        setMessage("");
      } else if (
        currentGuess.length < WORD_LENGTH &&
        key.length === 1 &&
        key >= "A" &&
        key <= "Z"
      ) {
        setCurrentGuess((prev) => prev + key);
        setMessage("");
      }
    },
    [gameState, currentGuess, handleSubmit]
  );

  // Handle physical keyboard
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameState !== "playing") return;
      const key = event.key.toUpperCase();
      if (key === "ENTER") {
        handleKeyPress("Enter");
      } else if (key === "BACKSPACE") {
        handleKeyPress("Backspace");
      } else if (key.length === 1 && key >= "A" && key <= "Z") {
        handleKeyPress(key);
      }
    },
    [gameState, handleKeyPress]
  );

  // Add/Remove keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Memoize keyboard statuses
  const memoizedKeyStatuses = useMemo(() => keyStatuses, [keyStatuses]);

  // Render Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
        <h1 className="text-4xl font-bold uppercase tracking-widest mb-6">
          Wordle Clone
        </h1>
        <p className="text-xl">Loading word lists...</p>
        {/* Show message if loading failed */}
        {message && <p className="mt-4 text-red-500">{message}</p>}
      </div>
    );
  }

  // Render Game
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <h1 className="text-4xl font-bold uppercase tracking-widest mb-6">
        Wordle Clone
      </h1>
      <Grid
        guesses={guesses}
        evaluations={evaluations}
        currentAttempt={currentAttempt}
        currentGuess={currentGuess}
        shakeRowIndex={shakeRowIndex}
      />
      <AnimatePresence>
        {message && (
          <motion.div
            className={`mb-4 px-4 py-2 rounded-md text-lg font-semibold ${
              gameState === "won"
                ? "bg-green-600"
                : gameState === "lost"
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {" "}
            {message}{" "}
          </motion.div>
        )}
      </AnimatePresence>
      {gameState === "playing" && (
        <Keyboard
          keyStatuses={memoizedKeyStatuses}
          onKeyPress={handleKeyPress}
        />
      )}
      {(gameState === "won" || gameState === "lost") && (
        <motion.button
          onClick={() => initializeGame(answerList)} // Reset with loaded answers
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors duration-150"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {" "}
          Play Again?{" "}
        </motion.button>
      )}
    </div>
  );
};

export default WordleGame;
