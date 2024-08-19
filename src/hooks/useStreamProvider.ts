import { useContext } from "react";
import { StreamContext } from "./StreamProvider";

const useStreamProvider = () => useContext(StreamContext);

export default useStreamProvider;
