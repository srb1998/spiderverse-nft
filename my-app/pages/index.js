import React, { useEffect, useRef, useState } from "react";
import Head from 'next/head';
import { Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { NFT_CONTRACT_ABI,NFT_CONTRACT_ADDRESS } from '@/constants';


export default function Home() {
    const [isOwner, setIsOwner] =useState(false);
    const [ presaleStarted, setPresaleStarted ] = useState(false);
    const [ presaleEnded, setPresaleEnded ] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [numTokensMinted , setNumTokensMinted] = useState("0");
    const [loading,setLoading] = useState(false);
    const web3ModalRef = useRef();

    const presaleMint = async() => {
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);

        const tx = await nftContract.presaleMint({
          value: utils.parseEther("0.01")
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("You Successfully minted a SpiderVerse");

      } catch (error) {
        console.log(error);
      }
    };

    const publicMint = async() => {

      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);

        const tx = await nftContract.mint({
          value: utils.parseEther("0.015")
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("You Successfully minted a SpiderVerse");

      } catch (error) {
        console.log(error);
      }
    };

    const connectWallet = async() => {
      try {
        await getProviderOrSigner();
        setWalletConnected(true);
        
      } catch (error) {
        console.log(error)
      }
    };

    const startPresale = async() => {
      try {
        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);

        const tx = await nftContract.startPresale();

        setLoading(true);
        await tx.wait();
        setLoading(false);
        
        await checkIfPresaleStarted();
      } catch (error) {
        console.error(error)        
      }
    };

    const getNumMintedTokens = async () => {
      try {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);
        const numTokenIds = await nftContract.tokenIds();
        setNumTokensMinted(numTokenIds.toString());
      } catch (error) {
        console.error(error)
      }
    };

    
    const checkIfPresaleStarted = async() => {
      try {
        const provider = await getProviderOrSigner();
        //Get an instance of your NFT Contract
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);

        const _presaleStarted = await nftContract.presaleStarted();
        if (!_presaleStarted){
          await getOwner();
        }
        setPresaleStarted(_presaleStarted);

        return _presaleStarted;
      } catch (error) {
        console.error(error)
        return false;
    
      }
    };

    const checkIfPresaleEnded = async() => {
      try {
        const provider = await getProviderOrSigner();
        
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);
        
        //This will return big number because presaleEnded is uint256
        //This will return timestamp in seconds
        const presaleEndTime = await nftContract.presaleEnded();
        const currentTimeInSeconds = Date.now()/1000;

        //Since it is big number there we cannot use '<' instead using .lt()
        //Also we are dividing by 1000 therefore it can be float value therefore using Math.floor()
        const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));
        if (hasPresaleEnded){
          setPresaleEnded(true);
        } else {
          setPresaleEnded(false);
        }
        return hasPresaleEnded;

      } catch (error) {
        console.log(error);
        return false;        
      }
    };

    const getOwner = async() => {
      try {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          provider
        );

        const _owner = await nftContract.owner();
        const signer = await getProviderOrSigner(true);
      
        const userAddress = await signer.getAddress();

        if ( userAddress.toLowerCase() === _owner.toLowerCase() ){
          setIsOwner(true);
        }

      } catch (error) {
        console.error(error);
      }
    };

    const getProviderOrSigner = async(needSigner = false) => {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      
      //Checking if user is connected to Sepolia Testnet, tell them to switch to Sepolia
      const {chainId} = await web3Provider.getNetwork();
      if (chainId !== 11155111){
        windows.alert("Please switch to Sepolia Testnet Network");
        throw new Error("Incorrect network");
      }
      
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    };

    const onPageLoad = async () => {
      await connectWallet();
      await getOwner();
      const _presaleStarted = await checkIfPresaleStarted();
      if(_presaleStarted){
        await checkIfPresaleEnded();
      }

      await getNumMintedTokens();

      // const presaleEndedInterval = setInterval(async function () {
      //   const _presaleStarted = await checkIfPresaleStarted();
      //   if (_presaleStarted) {
      //     const _presaleEnded = await checkIfPresaleEnded();
      //     if (_presaleEnded) {
      //       clearInterval(presaleEndedInterval);
      //     }
      //   }
      // }, 5 * 1000);

      // setInterval(async function(){
      //   await getNumMintedTokens();
      // },5*1000);

    };

    useEffect(() =>{
      if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network : "sepolia",
          providerOptions : {},
          disableInjectedProvider: false,
        });

        onPageLoad();

      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded();
      }
      getNumMintedTokens();

    
      }
    }, [walletConnected]);

    const renderButton = () => {
      if(!walletConnected){
        return (
          <button onClick={connectWallet} className={styles.button}>
            Connect Wallet
          </button>
        );
      }

       if (loading) {
      return <button className={styles.button}>Loading...</button>;
      }

      if (isOwner && !presaleStarted){
        //Render a button to start presale 
        return (
          <button onClick={startPresale} className={styles.button}>
            <b>Start Presale</b>
          </button>
        );
      }

      if (!presaleStarted){
        //Just say that presale hasnt started yet, Come back later
        return (
          <div>           
            <div className={styles.description}>
              Whitelist Phase will start soon!
            </div>
            <button disabled className={styles.noHoverButton}>
            <b>Minting Soon</b>
            </button>
          </div>
        );
      }

      if (presaleStarted && !presaleEnded){
        //Meaning WL phase going on so
        //Only WL addresses can mint 
        return (
          <div>
            <span className={styles.description}>
              Whitelist Phase has started!
            </span>
            <button  onClick={presaleMint} className={styles.button}>
              Mint 🚀
            </button>
          </div>
        );
      }

      if(presaleStarted && presaleEnded){
        //Public wallet Addresses can mint too
        return (
          <div>
            <div className={styles.description}>
              Public Mint has Started LFG!
            </div>
            <button onClick={publicMint} className={styles.button}>
              Mint 🚀
            </button>
          </div>
        );
      }

    }

  return (
    <div>
      <Head>
        <title>SpiderVerse</title>
        <meta name="description" content="wallet-connect-button" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}><b>WELCOME TO SPIDERVERSE NFT</b></h1>
          <div className={styles.description}>
            Get ticket to mind-bending ride through alternate reality versions of Spiderman.
          </div>   
          <div className={styles.description}>
            Total Minted - <b>{numTokensMinted}/20</b>
          </div>

          {renderButton()}
        </div>
        <img className={styles.image} src="/spiderverse/spiderman3.svg" />
        
      </div>
      <footer className={styles.footer}>
      <b>Crafted with &#10084; by Sourabh</b>
      </footer>

    </div>
  );
}
