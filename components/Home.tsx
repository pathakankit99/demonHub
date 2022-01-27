import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Container, Snackbar } from "@material-ui/core";
import { toDate } from "../helpers/utils";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Countdown from "react-countdown";
import Alert from "@material-ui/lab/Alert";
import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
// import useWalletBalance from "../hooks/useWalletBalance";
import { useWallet } from "@solana/wallet-adapter-react";
import useSplToken from "../hooks/useSplToken";
import ReactCountdown from "./ReactCountdown";
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  mintOneToken,
} from "../helpers/candy-machine";

import { AlertState } from "../helpers/utils";
import { MintButton } from "./MintButton";
import { PhaseHeader } from "./PhaseHeader";
import { GatewayProvider } from "@civic/solana-gateway-react";

const MintContainer = styled.div``; // add your styles here

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}

const Home = (props: HomeProps) => {
  const [yourSOLBalance, setYourSOLBalance] = useState<number | null>(null);
  const rpcUrl = props.rpcHost;
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const wallet = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [isLoading, isSPLExists] = useSplToken();
  // const [refresh, setRefresh] = useState(false);
  // const balance = useWalletBalance();
  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const onMint = async () => {
    try {
      setIsMinting(true);
      document.getElementById("#identity")?.click();
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey)
        )[0];

        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            "singleGossip",
            true
          );
        }

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      console.log("err ", error);
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (!error.message) {
          message = "Transaction Timeout! Please try again.";
        } else if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!anchorWallet) {
        return;
      }

      const balance = await props.connection.getBalance(anchorWallet.publicKey);
      setYourSOLBalance(balance);

      if (props.candyMachineId) {
        try {
          const cndy = await getCandyMachineState(
            anchorWallet,
            props.candyMachineId,
            props.connection
          );
          setCandyMachine(cndy);
        } catch (e) {
          console.log("Problem getting candy machine state");
          console.log(e);
        }
      } else {
        console.log("No candy machine detected in configuration.");
      }
    })();
  }, [anchorWallet, props.candyMachineId, props.connection]);

  const renderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: {
    days: any;
    hours: any;
    minutes: any;
    seconds: any;
    completed: any;
    }) => {
    console.log(completed,'completed');
    if (completed) {
      return (
        <div className=" max-w-lg mx-auto bg-white rounded-lg my-12 w-6/12  border-2 card shadow bg-white">
          <div className="justify-end flex p-3 border-gray-300 border-b pb-2">
            {/* <div className="hidden flex mr-auto">
              <img src="/star.svg" alt="" className="w-5 mr-2" />
              <div className="my-auto text-gray-600 text-sm">Whitelist</div>
            </div> */}
            {wallet?.connected && (
              <div className="flex ">
                <span className="my-auto mr-2 rounded-full h-2 w-2 bg-green-500" />
                <span className=" my-auto text-gray-600 text-sm">
                  {" "}
                  Connected{" "}
                </span>
              </div>
            )}
            {!wallet?.connected && (
              <div className="flex ">
                <span className="my-auto mr-2 rounded-full h-2 w-2 bg-gray-500" />
                <span className=" my-auto text-gray-600 text-sm">
                  {" "}
                  Not Connected{" "}
                </span>
              </div>
            )}
            <hr className="bg-black color-black" />
            <br />
          </div>
          <div className="p-6 text-center">
            <div className="flex justify-center items-center">
              <img width={220} src="example.gif" />
            </div>
            <h2 className="pt-12 text-lg sm:text-2xl font-mono font-bold py-5 tracking-wider">
              Shapes
            </h2>
            <p className="text-sm sm:text-md font-semibold pb-5 text-gray-600 ">
              A collection of shapes on the blockchain
            </p>
            {wallet?.connected ? (
              <>
                <MintContainer>
                  {candyMachine?.state.isActive &&
                  candyMachine?.state.gatekeeper &&
                  wallet.publicKey &&
                  wallet.signTransaction ? (
                    <GatewayProvider
                      wallet={{
                        publicKey:
                          wallet.publicKey ||
                          new PublicKey(CANDY_MACHINE_PROGRAM),
                        //@ts-ignore
                        signTransaction: wallet.signTransaction,
                      }}
                      gatekeeperNetwork={
                        candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                      }
                      clusterUrl={rpcUrl}
                      options={{ autoShowModal: false }}
                    >
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isMinting}
                        onMint={onMint}
                      />
                    </GatewayProvider>
                  ) : (
                    <MintButton
                      candyMachine={candyMachine}
                      isMinting={isMinting}
                      onMint={onMint}
                    />
                  )}
                </MintContainer>
              </>
            ) : (<div className="bg-indigo-200 p-3 text-indigo-900">
                Connect wallet to MINT!
            </div>)}

            {candyMachine && (
              <div className=" tracking-widest font-bold text-sm pt-3 text-gray-400">
                {candyMachine?.state?.itemsRedeemed}/
                {candyMachine?.state?.itemsAvailable} claimed
              </div>
            )}
          </div>
          {/* <Container maxWidth="xs" style={{ position: "relative" }}>
            <Paper
              style={{
                padding: 24,
                backgroundColor: "#151A1F",
                borderRadius: 6,
              }}
            >
              <Grid container justifyContent="center" direction="column">
                <PhaseHeader
                  candyMachine={candyMachine}
                  rpcUrl={rpcUrl}
                  whiteList={isSPLExists}
                />

                <>
                  <MintContainer>
                    {candyMachine?.state.isActive &&
                    candyMachine?.state.gatekeeper &&
                    wallet.publicKey &&
                    wallet.signTransaction ? (
                      <GatewayProvider
                        wallet={{
                          publicKey:
                            wallet.publicKey ||
                            new PublicKey(CANDY_MACHINE_PROGRAM),
                          //@ts-ignore
                          signTransaction: wallet.signTransaction,
                        }}
                        gatekeeperNetwork={
                          candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                        } 
                        clusterUrl={rpcUrl}
                        options={{ autoShowModal: false }}
                      >
                        <MintButton
                          candyMachine={candyMachine}
                          isMinting={isMinting}
                          onMint={onMint}
                        />
                      </GatewayProvider>
                    ) : (
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isMinting}
                        onMint={onMint}
                      />
                    )}
                  </MintContainer>
                </>
              </Grid>
            </Paper>
          </Container> */}
        </div>
      );
    } else {
      return (
        <div>
          <ReactCountdown
            days={days}
            minutes={minutes}
            hours={hours}
            seconds={seconds}
          />
        </div>
      );
    }
  };

  const candyMachineGoLive = toDate(candyMachine?.state.goLiveDate)?.getTime();

  return (
    <div>
      <Container style={{ marginTop: 100 }}>
        {candyMachineGoLive && wallet.connected ? (
          <div className="flex items-center justify-center">
            <Countdown
              className="flex items-center justify-center"
              date={isSPLExists ? 1640199600000 : candyMachineGoLive}
              renderer={renderer}
            />
          </div>
        ) : (
          <div></div>
        )}

        {!candyMachine && wallet?.connected && (
          <div className=" text-center mt-36 mb-6 text-2xl">Loading</div>
        )}

        {!wallet.connected && (
          <div className="flex items-center justify-center">
            <div className=" max-w-lg mx-auto bg-white rounded-lg my-12 w-6/12  border-2 card shadow bg-white">
              <div className="justify-end flex p-3 border-gray-300 border-b pb-2">
                {/* <div className="hidden flex mr-auto">
              <img src="/star.svg" alt="" className="w-5 mr-2" />
              <div className="my-auto text-gray-600 text-sm">Whitelist</div>
            </div> */}
                {wallet?.connected && (
                  <div className="flex ">
                    <span className="my-auto mr-2 rounded-full h-2 w-2 bg-green-500" />
                    <span className=" my-auto text-gray-600 text-sm">
                      {" "}
                      Connected{" "}
                    </span>
                  </div>
                )}
                {!wallet?.connected && (
                  <div className="flex ">
                    <span className="my-auto mr-2 rounded-full h-2 w-2 bg-gray-500" />
                    <span className=" my-auto text-gray-600 text-sm">
                      {" "}
                      Not Connected{" "}
                    </span>
                  </div>
                )}
                <hr className="bg-black color-black" />
                <br />
              </div>
              <div className="p-6 text-center">
                <div className="flex justify-center items-center">
                  <img width={220} src="example.gif" />
                </div>
                <h2 className="pt-12 text-lg sm:text-2xl font-mono font-bold py-5 tracking-wider">
                  Shapes
                </h2>
                <p className="text-sm sm:text-md font-semibold pb-5 text-gray-600 ">
                  A collection of shapes on the blockchain
                </p>
                {wallet?.connected ? (
                  <>
                    <MintContainer>
                      {candyMachine?.state.isActive &&
                      candyMachine?.state.gatekeeper &&
                      wallet.publicKey &&
                      wallet.signTransaction ? (
                        <GatewayProvider
                          wallet={{
                            publicKey:
                              wallet.publicKey ||
                              new PublicKey(CANDY_MACHINE_PROGRAM),
                            //@ts-ignore
                            signTransaction: wallet.signTransaction,
                          }}
                          gatekeeperNetwork={
                            candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                          }
                          clusterUrl={rpcUrl}
                          options={{ autoShowModal: false }}
                        >
                          <MintButton
                            candyMachine={candyMachine}
                            isMinting={isMinting}
                            onMint={onMint}
                          />
                        </GatewayProvider>
                      ) : (
                        <MintButton
                          candyMachine={candyMachine}
                          isMinting={isMinting}
                          onMint={onMint}
                        />
                      )}
                    </MintContainer>
                  </>
                ) : (
                  <div className="bg-indigo-200 p-3 text-indigo-900">
                    Connect wallet to MINT!
                  </div>
                )}

                {candyMachine && (
                  <div className=" tracking-widest font-bold text-sm pt-3 text-gray-400">
                    {candyMachine?.state?.itemsRedeemed}/
                    {candyMachine?.state?.itemsAvailable} claimed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Snackbar
          open={alertState.open}
          autoHideDuration={6000}
          onClose={() => setAlertState({ ...alertState, open: false })}
        >
          <Alert
            onClose={() => setAlertState({ ...alertState, open: false })}
            severity={alertState.severity}
          >
            {alertState.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default Home;
