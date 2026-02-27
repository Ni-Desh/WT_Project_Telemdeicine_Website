import React from 'react';
import { LgIcon } from '../../../../components/icons';
import { Col, FluidContainer, Row } from '../../../../components/layout';
import { BioData, Currency, FullName, ProfilePhoto } from '../../../../components/users';

export function PhysicianItem(props) {
    // Logic for Status Color
    const isOnline = props.user && props.user.status === 'online';
    const statusColor = isOnline ? 'text-success' : 'text-danger';

    return (
        <FluidContainer>
            <Row className="align-items-center">
                <Col className="col-auto position-relative">
                    <ProfilePhoto
                        className="md-pfl-sm"
                        session={props.session}
                        user={props.user}
                    />
                    {/* RED/GREEN STATUS DOT */}
                    <span className={`position-absolute ${statusColor}`} style={{bottom: 0, right: '5px', fontSize: '20px'}}>
                        ●
                    </span>
                </Col>
                <Col>
                    <Row className="text-truncate font-weight-bold">
                        <FullName user={props.user} />
                    </Row>
                    <Row className="md-font-sm text-truncate text-muted">
                        <BioData user={props.user} />
                    </Row>
                    <Row className="md-font-xs">
                        <span className={statusColor}>
                            {isOnline ? '● Available' : '● Busy/Offline'}
                        </span>
                    </Row>
                </Col>
                {props.clickable && (
                    <Col className="col-auto">
                        <LgIcon>navigate_next</LgIcon>
                    </Col>
                )}
            </Row>
        </FluidContainer>
    );
}

export function ServiceItem(props) {
    return (
        <FluidContainer>
            <Row className="align-items-center">
                <Col>
                    <Row className="text-truncate font-weight-bold">{props.service.name}</Row>
                    <Row className="md-font-sm text-truncate text-muted">
                        <Currency value={props.service.rate} />
                    </Row>
                </Col>
                {props.clickable && (
                    <Col className="col-auto">
                        <LgIcon>navigate_next</LgIcon>
                    </Col>
                )}
            </Row>
        </FluidContainer>
    );
}