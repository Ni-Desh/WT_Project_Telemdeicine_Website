import React, { useEffect } from 'react'; 
import { useSelector, useDispatch } from 'react-redux'; 
import { Col, FluidContainer, Row } from '../../components/layout.js';

// Direct import from the widgets file since index.js doesn't exist
import { WidgetColumns, WidgetRow, HealthTrendsChart } from '../../components/widgets'; 

import TitleBar from '../home/titleBar';
import Banner from './widgets/banner';
import RecentMedicationWidget from './widgets/recentMedications';
import RecentPaymentWidget from './widgets/recentPayments';
import TodayAppointmentWidget from './widgets/todaysAppointment';

import { getLocker } from '../../Actions/patient';

export default function DashBoardApp(props) {
    const dispatch = useDispatch();
    const session = useSelector(s => s.session);
    const records = useSelector((state) => state.patient.locker || []);

    useEffect(() => {
        // Automatically fetch data based on the logged-in user's name
        if (session.user && !session.isPhysician) {
            const patientName = session.user.firstName;
            dispatch(getLocker(patientName));
        }
    }, [dispatch, session]);

    return (
        <>
            <TitleBar title="Dashboard" />
            <Row className="flex-grow-1">
                <Col className="pt-3">
                    <FluidContainer>
                        <WidgetRow>
                            <Col>
                                <Banner session={session} />
                            </Col>
                        </WidgetRow>

                        <WidgetColumns>
                            <TodayAppointmentWidget session={session} />
                            {!session.isPhysician &&
                                <RecentMedicationWidget session={session} />
                            }
                            <RecentPaymentWidget session={session} />
                        </WidgetColumns>

                        {/* --- MEMBER A: PREDICTIVE HEALTH CHART --- */}
                        {!session.isPhysician && (
                            <WidgetRow className="mt-4">
                                <Col>
                                    {/* Show the chart if we have data, otherwise show a helpful message */}
                                    {records.length > 0 ? (
                                        <HealthTrendsChart lockerData={records} />
                                    ) : (
                                        <div className="card shadow-sm border-0 p-4 text-center">
                                            <p className="text-muted mb-0">
                                                No health records found for <strong>{session.user?.firstName}</strong>. 
                                                Try adding a completed appointment to see your trend!
                                            </p>
                                        </div>
                                    )}
                                </Col>
                            </WidgetRow>
                        )}
                    </FluidContainer>
                </Col>
            </Row>
        </>
    );
}