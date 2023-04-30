import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { providers,Contract, utils } from "ethers";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { NFT_CONTRACT_ABI,NFT_CONTRACT_ADDRESS } from '@/constants';
import { render } from 'react-dom';

export default function Home(props) {
    const [isOwner, setIsOwner] =useState(false);
    const [ presaleStarted, setPresaleStarted ] = useState(false);
    const [ presaleEnded, setPresaleEnded ] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [numTokensMinted , setNumTokensMinted] = useState("0");
    const [loading,setLoading] = useState(false);
    const web3ModalRef = useRef();

    const getNumMintedTokens = async () => {
      setLoading(true);
      try {
        const provider = await getProviderOrSigner();

        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);

        const numTokenIds = await nftContract.tokenIds();
        setNumTokensMinted(numTokenIds.toString());
      } catch (error) {
        console.error(error)
      }
      setLoading(false);
    };

    const presaleMint = async() => {
      setLoading(true);
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);

        const txn = await nftContract.presaleMint({
          value: utils.parseEther("0.01")
        });
        await txn.wait();
        
        window.alert("You Successfully minted a SpiderVerse");

      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };

    const publicMint = async() => {
      setLoading(true);
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);

        const txn = await nftContract.mint({
          value: utils.parseEther("0.015")
        });
        await txn.wait();
        
        window.alert("You Successfully minted a SpiderVerse");

      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };

    const getOwner = async() => {
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );
          
        const owner = await nftContract.owner();
        const userAddress = await signer.getAddress();

        if (owner.toLowerCase() === userAddress.toLowerCase() ){
          setIsOwner(true);
        }

      } catch (error) {
        console.error(error);
      }
    }

    // Funtion to start Presale Round
    const startPresale = async() => {
      setLoading(true);
      try {
        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);

        const txn = await nftContract.startPresale();
        await txn.wait();
        
        setPresaleStarted(true);
        
      } catch (error) {
        console.error(error)        
      }
      setLoading(false);
    };

    const checkIfPresaleStarted = async() => {
      try {
        const provider = await getProviderOrSigner();

        //Get an instance of your NFT Contract
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);

        const isPresaleStarted = await nftContract.presaleStarted();
        setPresaleStarted(isPresaleStarted);

        return isPresaleStarted;
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
        setPresaleEnded(hasPresaleEnded);

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

    const getProviderOrSigner = async(needSigner = false) => {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider)
      
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
    };

    const onPageLoad = async () => {
      await connectWallet();
      await getOwner();
      const presaleStarted = await checkIfPresaleStarted();
      if(presaleEnded){
        await checkIfPresaleEnded();
      }
      await getNumMintedTokens();

      //Track in real time the number of minted NFTs
      setInterval(async() => {(await getNumMintedTokens());
      } ,5 * 1000);

      //Track in real time the status of presale (started, ended, whatever)
      setInterval(async() => {

        const presaleStarted =  await checkIfPresaleStarted();
        if (presaleStarted){
          await checkIfPresaleEnded();
        }

      },5*1000);

    };

    useEffect(() =>{
      if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network : "sepolia",
          providerOptions : {},
          disableInjectedProvider: false,
        });

        onPageLoad();
      }
    }, []);

    function renderBody() {
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

      if(presaleEnded){
        //Public wallet Addresses can mint too
        return (
          <div>
            <span className={styles.description}>
              Public Mint has Started LFG!
            </span>
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

          {renderBody()}
        </div>
        <img className={styles.image} src="/spiderverse/spiderman3.svg" />
      </div>
      <footer className={styles.footer}>
      <b>Crafted with &#10084; by Sourabh</b>
      </footer>

    </div>
  )
}
