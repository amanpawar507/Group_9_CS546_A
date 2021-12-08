import { Avatar, Box, Button, Divider, Flex, HStack, Spacer, Text, useDisclosure, useToast, VStack } from "@chakra-ui/react"
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { MdBlock, MdGrade, MdCheck } from 'react-icons/md'
import client from "../../utils/client";
import { InfoText } from "../common/infoText"
import { RateModal } from "../common/rating/rateModal";
import { ReviewList } from "../common/rating/reviewList";
import { SuccessChart } from "./successChart";
import randomcolor from "randomcolor"
import { UserContext } from "../contexts/userContext";
import { DataDisplay } from "./dataDisplay";
import { RequestModal } from "../dashboard/requestModal";
import { EmptyAlert } from "../common/emptyAlert";

export const Profile = ({isFreelancer,isFreelancerProfile,userInfo,isUser,updateUserInfo}) => {

    const [chartInfo, setChartInfo] = useState();
    const [blackListing, setBlackListing] = useState();
    

    const {user:currentUser, setUser} = useContext(UserContext);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {isOpen: isRatingOpen, onOpen: onRatingOpen, onClose: onRatingClose} = useDisclosure();

    const toast = useToast();

    useEffect(() => {
        if(!userInfo) return;
        const getSuccessRate = async () => {
            const {data} = await client.get(`http://localhost:5000/freelancer/successRate/${userInfo._id}`);
            console.log(data);
            let labels = [];
            let values = [];
            let colors = [];
            for(let key in data.projectBySkills) {
                labels.push(key);
                values.push(data.projectBySkills[key]);
                colors.push(randomcolor());
            }
            console.log({labels,values, colors});
            setChartInfo({labels,values, colors, successRate : data.successRate});
        }
        console.log(currentUser);
        console.log("check ",currentUser.blacklist && currentUser.blacklist.includes(userInfo._id));
        if(isFreelancerProfile) getSuccessRate()
    },[isFreelancerProfile])

    const handleBlacklisting = async add => {
        try {
            setBlackListing(true);
            if(add) {
                const {data} = await client.post("http://localhost:5000/freelancer/blacklist",{
                    freelancerID: currentUser._id,
                    EmployerID: userInfo._id
                })
                setUser(data);
                setBlackListing(false)
            }else{
                debugger;
                const {data} = await client.delete(`http://localhost:5000/freelancer/blacklist/${currentUser._id}/${userInfo._id}`)
                setUser(data);
                setBlackListing(false)
            }
        } catch (error) {
            console.log(error);
            toast({
                title: "Could not blacklist",
                status: "error",
                duration: 2000
            });
            setBlackListing(false)
        }
    }

    return(
        <Box w="100%" h={'100%'}>
            <HStack w='100%' mb="40px" spacing={'50px'}>
                <Avatar size={"xl"} name={userInfo.fullName}/>
                {isFreelancerProfile && <DataDisplay content={`${userInfo.overallRating}/5`} label={`Rating (${userInfo.reviews.length} reviews)`}/>}
                {isFreelancerProfile && chartInfo && <DataDisplay content={`${chartInfo.successRate ?chartInfo.successRate : "0"}%`} label={"Success Rate"}/>}
                {!isFreelancer && isFreelancerProfile && <Button colorScheme={'teal'} onClick={() => onOpen()}>Request</Button>}
                {!isUser && isFreelancerProfile && <Button bg={"yellow.400"} leftIcon={<MdGrade/>} onClick={() => onRatingOpen()}>Rate</Button>}
                {isFreelancer && !isFreelancerProfile && <Button 
                isLoading={blackListing} 
                bg={'gray.500'} 
                leftIcon={(currentUser.blacklist && currentUser.blacklist.includes(userInfo._id) ) ? <MdCheck/> : <MdBlock/>} 
                onClick={() => handleBlacklisting(!currentUser.blacklist.includes(userInfo._id))}>
                    {(currentUser.blacklist && currentUser.blacklist.includes(userInfo._id) ) ? "Blacklisted": "Blacklist"}
                </Button>}
            </HStack>
            <HStack w='100%'  spacing={'20px'} minH={'60%'} mb='10px'>
                <Box minW={'250px'} maxW={'400px'} borderRight={'1px solid gray'}>
                    {userInfo.fullName && <InfoText label="Full Name" content={userInfo.fullName}/>}
                    {userInfo.companyName && <InfoText label="Company Name" content={userInfo.companyName}/>}
                    {userInfo.emailId && <InfoText label="Email" content={userInfo.emailId}/>}
                    {userInfo.introduction && <InfoText label="Introduction" content={userInfo.introduction}/>}
                    {userInfo.skills && <InfoText label="Skills" content={userInfo.skills.map(i => i.name).toString()}/>}
                    {userInfo.location && <InfoText label="Location" content={userInfo.location}/>}
                    {userInfo.expectedPay && <InfoText label="Expected Pay" content={`$${userInfo.expectedPay}`}/>}
                </Box>
                {/* <Flex minW={'200px'} justifyContent={"center"} direction={'column'} gap="10px"> */}
                    {isFreelancerProfile && (chartInfo && chartInfo.successRate ? <SuccessChart chartInfo={chartInfo}/> : <EmptyAlert text="No projects completed yet."/>)}
                {/* </Flex> */}
            </HStack>
            <Divider/>
            {isFreelancerProfile && <Box w={'100%'} pt='10px'>
                {userInfo.reviews.length > 0 ? <ReviewList reviews={userInfo.reviews}/> : <Text>No Reviews yet !</Text>}
            </Box>}
            <RateModal freelancer={userInfo} isOpen={isRatingOpen} onClose={onRatingClose} updateFreelancer={(data) => updateUserInfo(data)}/>
            <RequestModal isOpen={isOpen} onClose={() => onClose()} selectedFreelancer={userInfo}/>
        </Box>
    )
}
