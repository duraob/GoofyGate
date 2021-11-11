import React, {useEffect, useState} from 'react';
import { ethers, providers } from 'ethers';
import './App.css';
import abi from './utils/GoofGate.json';

export default function App() {
  // STATE
  const [currentAccount, setCurrentAccount] = useState('');
  const [goofers, setGoofers] = useState(0);
  const [allGoofs, setAllGoofs] = useState([]);
  const [inputValue, setInputValue] = useState('');
  // CONSTANT
  // Address of our contract
  const contractAddress = '0xE853E18c0D01f8c1c78C6e2590F58207D27869F7';
  // ABI json
  const contractABI = abi.abi;

  // Lets see if user connected their MetaMask Wallet
  const checkWalletConnection = async () => {
    try {
      const { ethereum } = window;

      if(!ethereum) {
        console.log('Metamask is needed to continue');
        return;
      } else {
        console.log('Eth obj available: ', ethereum);
      }
  
      // See if we are authorized to access the user's wallet
      const accounts = await ethereum.request({method: 'eth_accounts'});
  
      if(accounts.length !== 0) {
        const account = accounts[0];
        console.log('Auth account available: ', account);
        // Set the curretn account
        setCurrentAccount(account);
        getAllGoofs();
      } else {
        console.log('No authorized account avaiable.');
      }


    } catch (err) {
      console.log('Error in wallet connection: ', err);
    }

  };

  // Connect wallet method
  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if(!ethereum) {
        alert('Please download MetaMask.');
        return;
      }

      const accounts = await ethereum.request({method: 'eth_requestAccounts'});

      console.log('Connected to account: ', accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllGoofs();
    } catch (err) {
      console.log('Could not connect to any account.');
    }
  };

  const getAllGoofs = async () => {
    try {
      const{ethereum} = window;
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const goofGateContract = new ethers.Contract(contractAddress, contractABI, signer);

        // get current contract info
        // total goofers
        const count = await goofGateContract.getTotalGoofs();
        console.log('The total amount of goofs are...', count.toNumber());
        setGoofers(count.toNumber());

        // get goofs
        const goofs = await goofGateContract.getAllGoofs();

        // clean data
        let cleanGoofs = [];
        goofs.forEach(goof => {
          cleanGoofs.push({
            address: goof.goofer,
            timestamp: new Date(goof.timestamp * 1000),
            message: goof.message
          });
        });
        setAllGoofs(cleanGoofs);
      } else {
        console.log('No ethereum obj available.');
      }
    } catch(err) {
      console.log('Error getting all goofs: ', err);
    }
  };

  const goof = async () => {
    if(inputValue.length === 0) {
      console.log('No link or msg given!');
      return;
    }
    console.log('Msg or link:', inputValue);

    try {
      const {ethereum} = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const goofGateContract = new ethers.Contract(contractAddress, contractABI, signer);

        // WRITING FUNCTION TO BLOCKCHAIN
        const goofTxn = await goofGateContract.goof(inputValue, { gasLimit: 300000 });
        console.log('Mining...', goofTxn.hash);

        await goofTxn.wait();
        console.log('Mined --', goofTxn.hash);

        const count = await goofGateContract.getTotalGoofs();
        console.log('The total amount of goofs are...', count.toNumber());
        setGoofers(count.toNumber());
      } else {
        console.log('No ethereum object available.');
      }
    } catch(err) {
      console.log('Could not goof: ', err);
    }
  };

  useEffect(() => {
    let goofGateContract;
  
    const onNewGoof = (from, timestamp, message) => {
      console.log('NewGoof', from, timestamp, message);
      setAllGoofs(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      goofGateContract = new ethers.Contract(contractAddress, contractABI, signer);
      goofGateContract.on('NewGoof', onNewGoof);
    }
  
    return () => {
      if (goofGateContract) {
        goofGateContract.off('NewGoof', onNewGoof);
      }
    };
  }, []);


  const renderNotConnected = () => (
    <div className='container'>
      <button className='goofButton connect-wallet-button' onClick={connectWallet}>Connect MetaMask</button>
    </div>
  );

  const renderConnected = () => (
    <div className='connected-container'>
      <input type='text' placeholder='Give a goofy msg, or gif link!' value={inputValue} onChange={onInputChange}/>
      <button className='goofButton submit-button' onClick={goof}>GOOF OFF</button>

      <h3 className='subtext'>Goofy Goobers: {goofers}</h3>
      {allGoofs.map((goof, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {goof.address}</div>
              <div>Time: {goof.timestamp.toString()}</div>
              <div>Message: {goof.message}</div>
            </div>)
        })}
    </div>
  );

    // Get Input Change
    const onInputChange = (event) => {
      const {value} = event.target;
      setInputValue(value);
    };

  // Run our function when the page loads
  useEffect(() => {
    checkWalletConnection();
  },[]);
  
  return (
    <div className='mainContainer'>
      <div className={currentAccount ? 'authed-container' : 'container'}>
        <h2 className='header'>
          <span role='img'>😵‍💫🤌</span> Hey you GOOF!
        </h2>
        <p className='bio'>
        I am jetgoof and own a goofy little puppy, isn't that cool? 
        Connect your Ethereum wallet and show me how goofy you are!
        </p>
        {!currentAccount && renderNotConnected()}
        {currentAccount && renderConnected()}
      </div>
    </div>
  );
}
